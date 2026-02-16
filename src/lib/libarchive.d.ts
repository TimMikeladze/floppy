declare module "libarchive.js" {
  interface ArchiveInitOptions {
    workerUrl: string;
  }

  interface CompressedFile {
    name: string;
    size: number;
    extract(): Promise<File>;
  }

  interface ArchiveEntry {
    file: CompressedFile;
    path: string;
  }

  interface ArchiveInstance {
    getFilesArray(): Promise<ArchiveEntry[]>;
    getFilesObject(): Promise<
      Record<string, CompressedFile | Record<string, CompressedFile>>
    >;
    extractFiles(
      callback?: (entry: { file: File; path: string }) => void,
    ): Promise<Record<string, File | Record<string, File>>>;
    hasEncryptedData(): Promise<boolean | null>;
    usePassword(password: string): Promise<void>;
  }

  // biome-ignore lint/complexity/noStaticOnlyClass: type declaration for external library
  export class Archive {
    static init(options: ArchiveInitOptions): void;
    static open(file: File): Promise<ArchiveInstance>;
  }
}
