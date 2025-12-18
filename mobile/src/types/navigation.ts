import { Material } from './index';

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Register: undefined;
  Materials: { initialFilter?: 'all' | 'article' | 'poster' } | undefined;
  Video: { initialFilter?: 'all' | 'full' | 'part' } | undefined;
  MaterialDetail: { material: Material };
  Chat: undefined;
  AnonymousChat: undefined;
  History: undefined;
  Profile: undefined;
  StrokeScreening: undefined;
  HealthNotes: undefined;
};

export type TabParamList = {
  Home: undefined;
  Materials: { initialFilter?: 'all' | 'article' | 'poster' } | undefined;
  Video: { initialFilter?: 'all' | 'full' | 'part' } | undefined;
  Chat: undefined;
  History: undefined;
  HealthNotes: undefined;
  Profile: undefined;
};
