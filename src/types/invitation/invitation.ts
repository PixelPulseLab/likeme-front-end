export type InvitationCodeValidationProgram = {
  id: string;
  name: string;
  imageUrl: string | null;
};

export type InvitationCodeValidationProvider = {
  id: string;
  name: string;
  logoUrl: string | null;
};

export type InvitationCodeValidationCommunity = {
  id: string;
  displayName: string;
  imageUrl: string | null;
};

export type InvitationCodeValidationContext = {
  code: string;
  program: InvitationCodeValidationProgram;
  provider: InvitationCodeValidationProvider;
  community: InvitationCodeValidationCommunity | null;
};
