import { flag } from 'flags/next';

export const releasesFlag = flag<boolean>({
  key: 'releases',
  async decide() {
    return process.env.NEXT_PUBLIC_RELEASES_ENABLED === 'true';
  },
  description: 'Enable releases tab and page',
  defaultValue: false,
  options: [
    { value: false, label: 'Disabled' },
    { value: true, label: 'Enabled' },
  ],
});
