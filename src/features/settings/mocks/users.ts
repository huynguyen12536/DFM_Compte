import type { Membership, User } from "../types";

function membership(
  id: string,
  userId: string,
  companyId: string,
  roleId: string,
): Membership {
  return { id, userId, companyId, roleId };
}

export const mockUsers: User[] = [
  {
    id: "u-john",
    name: "John Doe",
    email: "john@dfm-europe.com",
    initials: "JD",
    status: "ACTIVE",
    lastActivityLabel: "12 min ago",
    memberships: [
      membership("m-john-eu", "u-john", "co-dfm-europe", "tenant-admin"),
      membership("m-john-ro", "u-john", "co-dfm-romania", "tenant-admin"),
      membership("m-john-be", "u-john", "co-dfm-belgium", "tenant-admin"),
    ],
  },
  {
    id: "u-marie",
    name: "Marie Laurent",
    email: "marie@dfm-europe.com",
    initials: "ML",
    status: "ACTIVE",
    lastActivityLabel: "1 h ago",
    memberships: [membership("m-marie-eu", "u-marie", "co-dfm-europe", "business-owner")],
  },
  {
    id: "u-nicolas",
    name: "Nicolas Bernard",
    email: "nicolas@dfm-europe.com",
    initials: "NB",
    status: "ACTIVE",
    lastActivityLabel: "Yesterday",
    memberships: [membership("m-nicolas-eu", "u-nicolas", "co-dfm-europe", "accountant")],
  },
  {
    id: "u-clara",
    name: "Clara Martin",
    email: "clara@dfm-europe.com",
    initials: "CM",
    status: "ACTIVE",
    lastActivityLabel: "3 h ago",
    memberships: [membership("m-clara-eu", "u-clara", "co-dfm-europe", "sales")],
  },
  {
    id: "u-sarah",
    name: "Sarah Dupont",
    email: "sarah@dfm-romania.com",
    initials: "SD",
    status: "INVITED",
    lastActivityLabel: "—",
    memberships: [membership("m-sarah-ro", "u-sarah", "co-dfm-romania", "viewer")],
  },
  {
    id: "u-long",
    name: "Jean-Baptiste de la Fontaine-Montesquieu",
    email: "jean-baptiste.fontaine-montesquieu@dfm-europe-holding.example.com",
    initials: "JF",
    status: "ACTIVE",
    lastActivityLabel: "5 d ago",
    memberships: [
      membership("m-long-eu", "u-long", "co-dfm-europe", "sales"),
      membership("m-long-be", "u-long", "co-dfm-belgium", "viewer"),
    ],
  },
];

/** @deprecated Use mockUsers. */
export const mockTeamMembers = mockUsers;
