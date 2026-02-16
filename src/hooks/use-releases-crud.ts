import { useCallback, useEffect, useState } from "react";
import { parse, stringify } from "yaml";
import {
  getAllSeries,
  getMergedReleases,
  getNewReleases,
  getReleaseById,
  getReleasesByDate,
  getReleasesConfig,
  getReleasesForMonth,
  getUpcomingReleases,
  searchReleases,
} from "@/lib/releases-merge";
import type {
  Format,
  Genre,
  Publisher,
  Release,
  ReleasesConfig,
  Series,
} from "@/lib/releases-types";
import {
  clearAllReleaseUserData,
  deleteCustomRelease,
  deleteReleaseOverride,
  getCustomReleases,
  getReleaseOverrides,
  markReleaseDeleted,
  saveCustomRelease,
  saveReleaseOverride,
  unmarkReleaseDeleted,
  updateCustomRelease,
} from "@/lib/storage";

export function useReleasesCrud() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [config, setConfig] = useState<{
    publishers: Publisher[];
    genres: Genre[];
    formats: Format[];
    settings: ReleasesConfig;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [releasesData, seriesData, configData] = await Promise.all([
        getMergedReleases(),
        getAllSeries(),
        getReleasesConfig(),
      ]);
      setReleases(releasesData);
      setSeries(seriesData);
      setConfig(configData);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load releases"),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createRelease = useCallback(
    async (release: Omit<Release, "id" | "isCustom" | "isModified">) => {
      try {
        await saveCustomRelease({
          ...release,
          isCustom: true,
        });
        await refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to create release"),
        );
        throw err;
      }
    },
    [refresh],
  );

  const updateRelease = useCallback(
    async (id: string, updates: Partial<Release>) => {
      try {
        const existing = releases.find((r) => r.id === id);
        if (!existing) {
          throw new Error("Release not found");
        }

        if (existing.isCustom) {
          await updateCustomRelease(id, updates);
        } else {
          await saveReleaseOverride(id, updates);
        }
        await refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to update release"),
        );
        throw err;
      }
    },
    [releases, refresh],
  );

  const deleteRelease = useCallback(
    async (id: string) => {
      try {
        const existing = releases.find((r) => r.id === id);
        if (!existing) {
          throw new Error("Release not found");
        }

        if (existing.isCustom) {
          await deleteCustomRelease(id);
        } else {
          await markReleaseDeleted(id);
        }
        await refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to delete release"),
        );
        throw err;
      }
    },
    [releases, refresh],
  );

  const resetRelease = useCallback(
    async (id: string) => {
      try {
        await deleteReleaseOverride(id);
        await unmarkReleaseDeleted(id);
        await refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to reset release"),
        );
        throw err;
      }
    },
    [refresh],
  );

  const resetAllUserData = useCallback(async () => {
    try {
      await clearAllReleaseUserData();
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to reset user data"),
      );
      throw err;
    }
  }, [refresh]);

  const exportAsYaml = useCallback(async () => {
    try {
      const customReleases = await getCustomReleases();
      const overrides = await getReleaseOverrides();

      const exportData = {
        customReleases: customReleases.map((r) => {
          const { isCustom, createdAt, modifiedAt, ...releaseData } = r;
          return {
            ...releaseData,
            releaseDate: r.releaseDate.toISOString().split("T")[0],
          };
        }),
        overrides: overrides.map((o) => ({
          releaseId: o.releaseId,
          overrides: {
            ...o.overrides,
            releaseDate: o.overrides.releaseDate
              ? new Date(o.overrides.releaseDate).toISOString().split("T")[0]
              : undefined,
          },
        })),
      };

      return stringify(exportData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to export data"));
      throw err;
    }
  }, []);

  const importFromYaml = useCallback(
    async (yamlText: string) => {
      try {
        const data = parse(yamlText) as {
          customReleases?: Array<
            Omit<Release, "id" | "isCustom" | "isModified">
          >;
          overrides?: Array<{ releaseId: string; overrides: Partial<Release> }>;
        };

        // Import custom releases
        if (data.customReleases) {
          for (const release of data.customReleases) {
            await saveCustomRelease({
              ...release,
              releaseDate: new Date(release.releaseDate),
              isCustom: true,
            });
          }
        }

        // Import overrides
        if (data.overrides) {
          for (const override of data.overrides) {
            await saveReleaseOverride(override.releaseId, override.overrides);
          }
        }

        await refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to import data"),
        );
        throw err;
      }
    },
    [refresh],
  );

  // Helper functions that use the merge layer
  const getNew = useCallback(async (days?: number) => {
    return getNewReleases(days);
  }, []);

  const getUpcoming = useCallback(async (days?: number) => {
    return getUpcomingReleases(days);
  }, []);

  const getByDate = useCallback(async (date: Date) => {
    return getReleasesByDate(date);
  }, []);

  const getForMonth = useCallback(async (year: number, month: number) => {
    return getReleasesForMonth(year, month);
  }, []);

  const getById = useCallback(async (id: string) => {
    return getReleaseById(id);
  }, []);

  const search = useCallback(async (query: string) => {
    return searchReleases(query);
  }, []);

  return {
    // Data
    releases,
    series,
    config,
    loading,
    error,

    // CRUD operations
    refresh,
    createRelease,
    updateRelease,
    deleteRelease,
    resetRelease,
    resetAllUserData,

    // Import/Export
    exportAsYaml,
    importFromYaml,

    // Query helpers
    getNew,
    getUpcoming,
    getByDate,
    getForMonth,
    getById,
    search,
  };
}
