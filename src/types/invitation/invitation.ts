import type { ProgramType } from '@/types/product/programType';

export type InvitationCodeValidationProgram = {
  id: string;
  name: string;
  imageUrl: string | null;
  programType: ProgramType;
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

export type InvitationActivationContext = InvitationCodeValidationContext & {
  displayName: string | null;
  alreadyParticipating: boolean;
};

export type PendingInvitationProgramDestination = {
  productId: string;
  programType: ProgramType;
  communityId: string | null;
};
