export interface FileData {
    id: number;
    type: 'folder' | 'file';
    name: string;
}

export const files: FileData[] = [
  { id: 1, type: 'folder', name: 'Project Alpha' },
  { id: 2, type: 'folder', name: 'Marketing Materials Q3' },
  { id: 3, type: 'file', name: 'Annual_Report_2023.pdf' },
  { id: 4, type: 'file', name: 'Website_Mockup_Final.fig' },
  { id: 5, type: 'folder', name: 'Design Assets' },
  { id: 6, type: 'file', name: 'Competitor_Analysis.xlsx' },
  { id: 7, type: 'file', name: 'Onboarding_Script.docx' },
  { id: 8, type: 'folder', name: 'User Research' },
  { id: 9, type: 'folder', name: 'Invoices 2024' },
];
