export enum SlideType {
  Cover = 'COVER',
  Agenda = 'AGENDA',
  Overview = 'OVERVIEW',
  Metric = 'METRIC',
  Grid3 = 'GRID3',
  SplitLeft = 'SPLIT_LEFT',
  SplitRight = 'SPLIT_RIGHT',
  Team = 'TEAM',
  List = 'LIST',
  ThankYou = 'THANK_YOU'
}

export interface SlideData {
  id: string;
  type: SlideType;
  title: string;
  subtitle: string;
  footer: string;
  backgroundImage: string | null;
  themeColor: string;
  // Dynamic content fields
  bodyText?: string;
  bulletPoints?: string[];
  bigValue?: string;
  gridItems?: { title: string; desc: string }[];
}

export interface GeneratedDeck {
  themeColor: string;
  slides: {
    type: SlideType;
    title: string;
    subtitle: string;
    bodyText?: string;
    bulletPoints?: string[];
    bigValue?: string;
    gridItems?: { title: string; desc: string }[];
  }[];
}