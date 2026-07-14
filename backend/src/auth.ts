import { createClerkClient } from "@clerk/fastify";
import type { FastifyRequest } from "fastify";

export type AccountIdentity = {
  clerkUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
};

export type IdentityProvider = {
  configured: boolean;
  authenticate(request: FastifyRequest): Promise<AccountIdentity | null>;
};

type ClerkIdentityProviderOptions = {
  authorizedParties: string[];
  publishableKey: string;
  secretKey: string;
};

export function createClerkIdentityProvider(
  options: ClerkIdentityProviderOptions | null,
): IdentityProvider {
  if (!options) {
    return {
      configured: false,
      authenticate: async () => null,
    };
  }

  const clerk = createClerkClient({
    publishableKey: options.publishableKey,
    secretKey: options.secretKey,
  });

  return {
    configured: true,
    async authenticate(request) {
      const authorization = request.headers.authorization;

      if (!authorization?.startsWith("Bearer ")) {
        return null;
      }

      const requestState = await clerk.authenticateRequest(
        new Request(`https://backend.internal${request.url}`, {
          headers: { authorization },
          method: request.method,
        }),
        {
          acceptsToken: "session_token",
          authorizedParties: options.authorizedParties,
        },
      );

      if (!requestState.isAuthenticated) {
        return null;
      }

      const { userId } = requestState.toAuth();
      const user = await clerk.users.getUser(userId);
      const primaryEmail = user.primaryEmailAddress;

      if (!primaryEmail || primaryEmail.verification?.status !== "verified") {
        throw new Error(`Clerk user ${userId} does not have a verified primary email address.`);
      }

      const primaryPhone = user.primaryPhoneNumber;

      return {
        clerkUserId: user.id,
        email: primaryEmail.emailAddress.trim().toLowerCase(),
        firstName: user.firstName,
        lastName: user.lastName,
        phone:
          primaryPhone?.verification?.status === "verified" ? primaryPhone.phoneNumber : null,
      };
    },
  };
}
