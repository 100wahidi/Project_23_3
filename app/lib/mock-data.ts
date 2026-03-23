export const overviewComparisonSeries = [
  { label: 'Jan', uniqueLines: 412, duplicateLines: 18 },
  { label: 'Feb', uniqueLines: 438, duplicateLines: 22 },
  { label: 'Mar', uniqueLines: 460, duplicateLines: 17 },
  { label: 'Apr', uniqueLines: 453, duplicateLines: 24 },
  { label: 'May', uniqueLines: 486, duplicateLines: 21 },
  { label: 'Jun', uniqueLines: 512, duplicateLines: 33 },
  { label: 'Jul', uniqueLines: 498, duplicateLines: 19 },
  { label: 'Aug', uniqueLines: 526, duplicateLines: 15 },
];

export const duplicateLineSamples = [
  {
    record_id: 'CUST-1021',
    dataset: 'Customer Database',
    duplicate_key: 'alice.johnson@company.com',
    reason: 'Same email found in 2 rows',
    source_line: 214,
  },
  {
    record_id: 'ORD-2210',
    dataset: 'Sales Transactions',
    duplicate_key: 'ORD-2210|2026-03-10',
    reason: 'Exact duplicate order row',
    source_line: 388,
  },
  {
    record_id: 'PROD-3088',
    dataset: 'Product Catalog',
    duplicate_key: 'SKU-4092',
    reason: 'Duplicate SKU with different casing',
    source_line: 552,
  },
  {
    record_id: 'SUP-4012',
    dataset: 'Suppliers',
    duplicate_key: 'acme-ltd',
    reason: 'Same supplier normalized key',
    source_line: 703,
  },
];

export const technicalDataRows = [
  {
    kri: 'Customer onboarding consistency',
    ggi: 101,
    common_name: 'Alice Johnson',
    bl: 'Retail Banking',
    subbl: 'Digital Accounts',
    pending_date: '2026-03-01',
    snapshot_date: '2026-03-15',
    traitement: 'yes',
    exposure_days: 14.0,
    duplicate_flag: false,
  },
  {
    kri: 'Duplicate customer identifier',
    ggi: 102,
    common_name: 'Bob Smith',
    bl: 'Retail Banking',
    subbl: 'Savings',
    pending_date: '2026-03-03',
    snapshot_date: '2026-03-15',
    traitement: 'no',
    exposure_days: 12.5,
    duplicate_flag: true,
  },
  {
    kri: 'Missing activation date',
    ggi: 103,
    common_name: 'Carla Gomez',
    bl: 'Corporate Banking',
    subbl: 'Lending',
    pending_date: '2026-03-05',
    snapshot_date: '2026-03-15',
    traitement: 'yes',
    exposure_days: 9,
    duplicate_flag: false,
  },
  {
    kri: 'Reference data drift',
    ggi: 104,
    common_name: 'David Martin',
    bl: 'Wealth Management',
    subbl: 'Advisory',
    pending_date: '2026-03-07',
    snapshot_date: '2026-03-15',
    traitement: 'yes',
    exposure_days: 7.25,
    duplicate_flag: false,
  },
  {
    kri: 'Invalid GGI sample',
    ggi: 0,
    common_name: 'Eva Taylor',
    bl: 'Insurance',
    subbl: 'Claims',
    pending_date: '2026-03-08',
    snapshot_date: '2026-03-15',
    traitement: 'no',
    exposure_days: 4.5,
    duplicate_flag: true,
  },
  {
    kri: 'Negative exposure example',
    ggi: 106,
    common_name: 'Farid Khan',
    bl: 'Insurance',
    subbl: 'Underwriting',
    pending_date: '2026-03-09',
    snapshot_date: '2026-03-15',
    traitement: 'yes',
    exposure_days: -2,
    duplicate_flag: false,
  },
  {
    kri: 'Null common name sample',
    ggi: 107,
    common_name: null,
    bl: 'Retail Banking',
    subbl: 'Credit Cards',
    pending_date: '2026-03-10',
    snapshot_date: '2026-03-15',
    traitement: 'yes',
    exposure_days: 5.75,
    duplicate_flag: false,
  },
  {
    kri: 'Bad date format sample',
    ggi: 108,
    common_name: 'Grace Lee',
    bl: 'Corporate Banking',
    subbl: 'Treasury',
    pending_date: '15/03/2026',
    snapshot_date: '2026-03-15',
    traitement: 'maybe',
    exposure_days: 'N/A',
    duplicate_flag: true,
  },
];

export const technicalValidationMock = {
  "status": "failed",
  "total_rows": technicalDataRows.length,
  "report": [
    {
      "column": "ggi",
      "check": "coerce_dtype('int64')",
      "failure_case": "ABC",
      "index": 2
    },
    {
      "column": "ggi",
      "check": "coerce_dtype('int64')",
      "failure_case": "Nullvalue",
      "index": 8
    },
    {
      "column": "ggi",
      "check": "greater_than_or_equal_to(0)",
      "failure_case": "TypeError(\"'>=' not supported between instances of 'str' and 'int'\")",
      "index": null
    },
    {
      "column": "exposure_days",
      "check": "dtype('float64')",
      "failure_case": " ",
      "index": 39
    },
    {
      "column": "exposure_days",
      "check": "dtype('float64')",
      "failure_case": "Nullvalue",
      "index": 10
    },
    {
      "column": "exposure_days",
      "check": "greater_than_or_equal_to(0)",
      "failure_case": "TypeError(\"'>=' not supported between instances of 'str' and 'int'\")",
      "index": null
    }
  ]
}