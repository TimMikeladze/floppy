import { flag } from 'flags/next';

export const csvImportFlag = flag<boolean>({
  key: 'csv-import',
  async decide() {
    return false;
  },
  description: 'Enable CSV data import feature',
  defaultValue: false,
  options: [
    { value: false, label: 'Disabled' },
    { value: true, label: 'Enabled' },
  ],
});
