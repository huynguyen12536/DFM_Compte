export const currentOwnerId = "fm";

export const demoAccess = {
  canCreateCustomer: true,
};

/** Mock signed-in account shown in the shell header. */
export const currentUser = {
  id: "u-john",
  name: "John Doe",
  email: "john@dfm-europe.com",
  initials: "JD",
  roleLabel: "Tenant admin",
} as const;
