export type PaintingCandidate = {
  id: string;
  rank: number;
  confidence: number | null;
  artist: string | null;
  title: string | null;
  date_created: string | null;
  location_painted: string | null;
  style: string | null;
  medium: string | null;
  source: string | null;
};

export type Artwork = {
  id: string;
  image_url: string;
  museum_name: string;
  museum_city: string | null;
  museum_country: string | null;
  saw_date: string | null;
  opinion: string | null;
  status: string;
  selected_candidate_id: string | null;
  painting_candidates?: PaintingCandidate[];
};


