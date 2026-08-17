export type Farmer = {
  id?: string;
  grower_number: string;
  name: string;
  national_id: string;
  mobile_number?: string;
  buying_center: string;
  route: string;
  created_at?: string;
};

export type CsvRow = {
  grower_number?: string;
  name?: string;
  national_id?: string;
  mobile_number?: string;
  buying_center?: string;
  route?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  [key: string]: string | undefined;
};
