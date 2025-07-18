"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Ban,
  CircleCheck,
  CircleAlert,
} from "lucide-react";
import { DateRangePicker } from "@/components/date-range-picker";
import { graphqlClient } from "@/lib/graphql-client";
import { EnhancedMultiSelectDropdown } from "@/components/enhanced-multi-select-dropdown";

interface Member {
  id: string;
  name: string;
  verificationStatus: string;
  depositsCount: number;
  emailAddress: string;
  mobileNumber: string;
  domain: string;
  dateTimeCreated: string;
  dateTimeLastActive: string;
  status: string;
}

interface MembersResponse {
  members: {
    edges: Array<{
      node: Member;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string;
    };
  };
}

interface SearchResponse {
  membersByName?: Member[];
  membersByEmailAddress?: Member[];
  membersByMobileNumber?: Member[];
  membersByDomain?: Member[];
}

// New interface for filter options
interface FilterOptions {
  names: string[];
  emailAddresses: string[];
  mobileNumbers: string[];
  domains: string[];
  verificationStatuses: string[];
  statuses: string[];
}

// Use the exact queries provided by the user
const MEMBERS_QUERY = `
  query ($first: Int, $after: Cursor, $filter: MemberFilterInput) {
    members(first: $first, after: $after, filter: $filter) {
      edges {
        node {
          id
          ... on Member {
            name
            verificationStatus
            depositsCount
            emailAddress
            mobileNumber
            domain
            dateTimeCreated
            dateTimeLastActive
            status
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// New query to get all unique filter options
const FILTER_OPTIONS_QUERY = `
  query {
    members(first: 1000) {
      edges {
        node {
          id
          ... on Member {
            name
            verificationStatus
            depositsCount
            emailAddress
            mobileNumber
            domain
            status
          }
        }
      }
    }
  }
`;

const SEARCH_BY_NAME_QUERY = `
  query ($search: String!) {
    membersByName(search: $search, first: 20) {
      id
      name
      verificationStatus
      depositsCount
      emailAddress
      mobileNumber
      domain
      dateTimeCreated
      dateTimeLastActive
      status
    }
  }
`;

const SEARCH_BY_EMAIL_QUERY = `
  query ($search: String!) {
    membersByEmailAddress(search: $search, first: 20) {
      id
      name
      verificationStatus
      depositsCount
      emailAddress
      mobileNumber
      domain
      dateTimeCreated
      dateTimeLastActive
      status
    }
  }
`;

const SEARCH_BY_MOBILE_QUERY = `
  query ($search: String!) {
    membersByMobileNumber(search: $search, first: 20) {
      id
      name
      verificationStatus
      depositsCount
      emailAddress
      mobileNumber
      domain
      dateTimeCreated
      dateTimeLastActive
      status
    }
  }
`;

const SEARCH_BY_DOMAIN_QUERY = `
  query ($search: String!) {
    membersByDomain(search: $search, first: 20) {
      id
      name
      verificationStatus
      depositsCount
      emailAddress
      mobileNumber
      domain
      dateTimeCreated
      dateTimeLastActive
      status
    }
  }
`;

export default function MembersTable() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<
    "name" | "email" | "mobile" | "domain"
  >("name");

  // New state for filter options
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    names: [],
    emailAddresses: [],
    mobileNumbers: [],
    domains: [],
    verificationStatuses: [],
    statuses: [],
  });
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);

  // State for selected filters
  const [selectedVerificationStatus, setSelectedVerificationStatus] =
    useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedName, setSelectedName] = useState<string[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string[]>([]);
  const [selectedMobile, setSelectedMobile] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string[]>([]);
  // Date range filters
  const [dateRegisteredRange, setDateRegisteredRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [dateLastActiveRange, setDateLastActiveRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      setFilterOptionsLoading(true);

      const response = await graphqlClient.request<MembersResponse>(
        FILTER_OPTIONS_QUERY
      );

      const allMembers = response.members.edges.map((edge) => edge.node);

      // Extract unique values for each filter
      const names = [
        ...new Set(allMembers.map((m) => m.name).filter(Boolean)),
      ].sort();
      const emailAddresses = [
        ...new Set(allMembers.map((m) => m.emailAddress).filter(Boolean)),
      ].sort();
      const mobileNumbers = [
        ...new Set(allMembers.map((m) => m.mobileNumber).filter(Boolean)),
      ].sort();
      const domains = [
        ...new Set(allMembers.map((m) => m.domain).filter(Boolean)),
      ].sort();
      const verificationStatuses = [
        ...new Set(allMembers.map((m) => m.verificationStatus).filter(Boolean)),
      ].sort();
      const statuses = [
        ...new Set(allMembers.map((m) => m.status).filter(Boolean)),
      ].sort();

      setFilterOptions({
        names,
        emailAddresses,
        mobileNumbers,
        domains,
        verificationStatuses,
        statuses,
      });
    } catch (err) {
      console.error("Error fetching filter options:", err);
      // Fallback to empty options if filter fetch fails
      setFilterOptions({
        names: [],
        emailAddresses: [],
        mobileNumbers: [],
        domains: [],
        verificationStatuses: [],
        statuses: [],
      });
    } finally {
      setFilterOptionsLoading(false);
    }
  }, []);

  // Fetch members using the provided GraphQL query, now with filters
  const fetchMembers = useCallback(
    async (cursor?: string, isNextPage = false) => {
      try {
        setLoading(true);
        setError(null);

        // Build filter object
        const filter: { [key: string]: any } = {};
        if (selectedVerificationStatus) {
          filter.verificationStatus = {
            equal: selectedVerificationStatus.toUpperCase(),
          };
        }
        if (selectedStatus) {
          filter.status = { equal: selectedStatus.toUpperCase() };
        }
        if (selectedName && selectedName.length > 0) {
          filter.name =
            selectedName.length === 1
              ? { equal: selectedName[0] }
              : { in: selectedName };
        }
        if (selectedEmail && selectedEmail.length > 0) {
          filter.emailAddress =
            selectedEmail.length === 1
              ? { equal: selectedEmail[0] }
              : { in: selectedEmail };
        }
        if (selectedMobile && selectedMobile.length > 0) {
          filter.mobileNumber =
            selectedMobile.length === 1
              ? { equal: selectedMobile[0] }
              : { in: selectedMobile };
        }
        if (selectedDomain && selectedDomain.length > 0) {
          filter.domain =
            selectedDomain.length === 1
              ? { equal: selectedDomain[0] }
              : { in: selectedDomain };
        }
        // Date Registered filter
        if (dateRegisteredRange.start || dateRegisteredRange.end) {
          filter.dateTimeCreated = {};
          if (dateRegisteredRange.start) {
            filter.dateTimeCreated.greaterThanOrEqual =
              dateRegisteredRange.start.toISOString();
          }
          if (dateRegisteredRange.end) {
            filter.dateTimeCreated.lesserThanOrEqual =
              dateRegisteredRange.end.toISOString();
          }
        }
        // Date and Time Last Active filter
        if (dateLastActiveRange.start || dateLastActiveRange.end) {
          filter.dateTimeLastActive = {};
          if (dateLastActiveRange.start) {
            filter.dateTimeLastActive.greaterThanOrEqual =
              dateLastActiveRange.start.toISOString();
          }
          if (dateLastActiveRange.end) {
            filter.dateTimeLastActive.lesserThanOrEqual =
              dateLastActiveRange.end.toISOString();
          }
        }

        const variables = {
          first: entriesPerPage,
          after: cursor || null,
          filter,
        };

        const response = await graphqlClient.request<MembersResponse>(
          MEMBERS_QUERY,
          variables
        );
        const newMembers = response.members.edges.map((edge) => edge.node);

        setMembers(newMembers);
        setHasNextPage(response.members.pageInfo.hasNextPage);
        setEndCursor(response.members.pageInfo.endCursor);
        console.log("Fetched members:", newMembers);
        // Track page history for proper back navigation
        if (isNextPage && cursor) {
          setPageHistory((prev) => [...prev, cursor]);
        }
      } catch (err) {
        setError(
          "Failed to fetch members. Please check your GraphQL endpoint and authentication."
        );
        console.error("Error fetching members:", err);
      } finally {
        setLoading(false);
      }
    },
    [
      entriesPerPage,
      selectedVerificationStatus,
      selectedStatus,
      selectedName,
      selectedEmail,
      selectedMobile,
      selectedDomain,
      dateRegisteredRange.start,
      dateRegisteredRange.end,
      dateLastActiveRange.start,
      dateLastActiveRange.end,
    ]
  );

  // Search members using the provided search queries
  const searchMembers = useCallback(
    async (term: string, type: typeof searchType) => {
      if (!term.trim()) {
        setIsSearching(false);
        setCurrentPage(1);
        fetchMembers();
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setIsSearching(true);

        const queryMap = {
          name: SEARCH_BY_NAME_QUERY,
          email: SEARCH_BY_EMAIL_QUERY,
          mobile: SEARCH_BY_MOBILE_QUERY,
          domain: SEARCH_BY_DOMAIN_QUERY,
        };

        const query = queryMap[type];
        const variables = { search: term };

        const response = await graphqlClient.request<SearchResponse>(
          query,
          variables
        );

        // Extract members from the response based on search type
        const searchResults =
          response[
            `membersBy${
              type.charAt(0).toUpperCase() + type.slice(1)
            }` as keyof SearchResponse
          ] || [];

        setMembers(Array.isArray(searchResults) ? searchResults : []);
        setHasNextPage(false);
        setEndCursor(null);
        setPageHistory([]);
        setCurrentPage(1);
      } catch (err) {
        setError(
          "Failed to search members. Please check your GraphQL endpoint and authentication."
        );
        console.error("Error searching members:", err);
      } finally {
        setLoading(false);
      }
    },
    [fetchMembers]
  );

  // Initial load - fetch both filter options and members
  useEffect(() => {
    fetchFilterOptions();
    fetchMembers();
  }, [fetchFilterOptions, fetchMembers]);

  // Search with debouncing
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm) {
        searchMembers(searchTerm, searchType);
      } else {
        setIsSearching(false);
        setCurrentPage(1);
        fetchMembers();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, searchType, searchMembers]);

  // Reset pagination when entries per page changes
  useEffect(() => {
    if (!isSearching) {
      setCurrentPage(1);
      setPageHistory([]);
      fetchMembers();
    }
  }, [entriesPerPage, isSearching, fetchMembers]);

  const getVerificationBadge = (status: string) => {
    const config = {
      VERIFIED: {
        icon: <div className="w-2 h-2 bg-[#12B76A] rounded-full" />,
        className:
          "bg-transparent border border-[#008005] text-[#027A48] hover:bg-transparent",
      },
      UNVERIFIED: {
        icon: <div className="w-2 h-2 bg-[#F63D68] rounded-full" />,
        className:
          "bg-transparent border border-[#800C05] text-[#C01048] hover:bg-transparent",
      },
      PENDING: {
        icon: <div className="w-2 h-2 bg-[#EF6820] rounded-full" />,
        className:
          "bg-transparent border border-[#B93815] text-[#B93815] hover:bg-transparent",
      },
    };
    const normalized = status.toUpperCase();
    const { icon, className } =
      config[normalized as keyof typeof config] || config.PENDING;
    return (
      <Badge
        className={`${className} px-3 py-1 text-xs font-medium rounded-full flex items-center gap-2`}
      >
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const config = {
      ACTIVE: {
        icon: <CircleCheck className="w-3 h-3" />,
        className:
          "bg-[#053321] text-[#75E0A7] hover:bg-green-800 border-0 border-[#085D3A]",
        label: "Active",
      },
      BLACKLISTED: {
        icon: <CircleAlert className="w-3 h-3 text-[#F04438]" />,
        className:
          "bg-[#55160C] text-[#FDA29B] hover:bg-red-800 border border-[#912018]",
        label: "Blacklisted",
      },
      SUSPENDED: {
        icon: <Ban className="w-3 h-3 text-[#85888E]" />,
        className:
          "bg-[#161B26] text-[#CECFD2] hover:bg-gray-800 border border-[#333741]",
        label: "Disabled",
      },
    };
    const normalized = status.toUpperCase();
    const { icon, className, label } =
      config[normalized as keyof typeof config] || config.ACTIVE;
    return (
      <Badge
        className={`${className} px-2 py-1 text-xs font-medium leading-[18px] rounded-full flex items-center gap-1`}
      >
        {icon}
        {normalized === "SUSPENDED" ? "Disabled" : label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      }) +
      " " +
      date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(members.map((member) => member.id));
    } else {
      setSelectedMembers([]);
    }
  };

  const handleSelectMember = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers((prev) => [...prev, memberId]);
    } else {
      setSelectedMembers((prev) => prev.filter((id) => id !== memberId));
    }
  };

  const handleNextPage = () => {
    if (hasNextPage && endCursor && !isSearching) {
      fetchMembers(endCursor, true);
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1 && !isSearching) {
      setCurrentPage((prev) => prev - 1);

      // Get the previous cursor from history
      const newHistory = [...pageHistory];
      const prevCursor = newHistory.pop();
      setPageHistory(newHistory);

      // If we're going back to page 1, don't use a cursor
      if (currentPage === 2) {
        fetchMembers();
      } else {
        fetchMembers(prevCursor);
      }
    }
  };

  if (error) {
    return (
      <div className="bg-[#1a1f2e] text-white p-6 rounded-lg">
        <div className="text-center text-red-400">
          <p className="mb-4">{error}</p>
          <Button
            onClick={() => fetchMembers()}
            className="bg-yellow-500 text-black hover:bg-yellow-600"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0B1D26] border-1 border-[#2E2E2E] rounded-md text-white w-[1376px]">
      {/* Filters Row */}
      <div className="flex items-center flex-wrap">
        <div className="flex items-center gap-4 flex-wrap px-4 py-3">
          <div className="flex gap-1.5">
            <span className="text-white font-medium">Filters</span>
            <div className="h-6 w-0.5 bg-[#EAECF0]"></div>
          </div>

          <EnhancedMultiSelectDropdown
            placeholder={"Name"}
            searchPlaceholder="Search Username"
            options={filterOptionsLoading ? [] : filterOptions.names}
            onSelectionChange={setSelectedName}
          />

          <Select
            value={selectedVerificationStatus}
            onValueChange={(value) => {
              setSelectedVerificationStatus(value);
            }}
          >
            <SelectTrigger
              className="w-auto bg-[#0A1117] border-gray-600 font-medium text-[14px] leading-[20px]"
              style={{ color: "#7A7A7A" }}
            >
              <span className="text-[#7A7A7A]">Verification Status</span>
            </SelectTrigger>
            <SelectContent className="bg-[#0A1117] border-gray-600">
              {filterOptionsLoading ? (
                <SelectItem value="loading" disabled className="text-[#F0F0F0]">
                  Loading options...
                </SelectItem>
              ) : (
                filterOptions.verificationStatuses.map((status) => (
                  <SelectItem
                    key={status}
                    value={status.toLowerCase()}
                    className="text-[#F0F0F0] focus:text-white"
                  >
                    {status.charAt(0).toUpperCase() +
                      status.slice(1).toLowerCase()}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <EnhancedMultiSelectDropdown
            placeholder={"Email Address"}
            searchPlaceholder="Search Email"
            options={filterOptionsLoading ? [] : filterOptions.emailAddresses}
            onSelectionChange={setSelectedEmail}
          />

          <EnhancedMultiSelectDropdown
            placeholder={"Mobile Number"}
            searchPlaceholder="Search Mobile"
            options={filterOptionsLoading ? [] : filterOptions.mobileNumbers}
            onSelectionChange={setSelectedMobile}
          />

          <EnhancedMultiSelectDropdown
            placeholder={"Domain"}
            searchPlaceholder="Search Domain"
            options={filterOptionsLoading ? [] : filterOptions.domains}
            onSelectionChange={setSelectedDomain}
          />

          {/* Date Registered Filter */}
          <DateRangePicker
            placeholder="Date Registered"
            onDateChange={(start, end) =>
              setDateRegisteredRange({ start, end })
            }
          />

          <Select
            value={selectedStatus}
            onValueChange={(value) => {
              setSelectedStatus(value);
            }}
          >
            <SelectTrigger
              className="w-auto bg-[#0A1117] border-gray-600 font-medium text-[14px] leading-[20px]"
              style={{ color: "#7A7A7A", background: "#0A1117" }}
            >
              <span className="text-[#7A7A7A]">Status</span>
            </SelectTrigger>
            <SelectContent className="bg-[#0A1117] border-gray-600">
              {filterOptionsLoading ? (
                <SelectItem value="loading" disabled className="text-[#F0F0F0]">
                  Loading options...
                </SelectItem>
              ) : (
                filterOptions.statuses.map((status) => (
                  <SelectItem
                    key={status}
                    value={status.toLowerCase()}
                    className="text-[#F0F0F0] focus:text-white"
                  >
                    {status.toUpperCase() === "SUSPENDED" ? "Disabled" : status}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {/* Date and Time Last Active Filter */}
          <DateRangePicker
            placeholder="Date & Time Last Active"
            onDateChange={(start, end) =>
              setDateLastActiveRange({ start, end })
            }
          />
        </div>
        {/* End Filters Row */}

        <Table>
          <TableHeader className="border-t border-[#2E2E2E]">
            <TableRow className="border-b border-[#2E2E2E]">
              <TableHead className="text-[#667085] text-[12px] leading-[18px] tracking-normal font-medium min-w-[120px] w-[140px]">
                Name
              </TableHead>
              <TableHead className="text-[#667085] text-[12px] leading-[18px] tracking-normal font-medium min-w-[140px] w-[160px]">
                Verification Status
              </TableHead>
              <TableHead className="text-[#667085] text-[12px] leading-[18px] tracking-normal font-medium min-w-[80px] w-[100px]">
                Balance
              </TableHead>
              <TableHead className="text-[#667085] text-[12px] leading-[18px] tracking-normal font-medium min-w-[180px] w-[220px]">
                Email address
              </TableHead>
              <TableHead className="text-[#667085] text-[12px] leading-[18px] tracking-normal font-medium min-w-[140px] w-[160px]">
                Mobile number
              </TableHead>
              <TableHead className="text-[#667085] text-[12px] leading-[18px] tracking-normal font-medium min-w-[120px] w-[140px]">
                Domain
              </TableHead>
              <TableHead className="text-[#667085] text-[12px] leading-[18px] tracking-normal font-medium min-w-[120px] w-[140px]">
                Date Registered
              </TableHead>
              <TableHead className="text-[#667085] text-[12px] leading-[18px] tracking-normal font-medium min-w-[100px] w-[120px]">
                Status
              </TableHead>
              <TableHead className="text-[#667085] text-[12px] leading-[18px] tracking-normal font-medium min-w-[120px] w-[140px]">
                Date and Time Last Active
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-[#0C1820]">
            {loading && members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500 mr-2"></div>
                    Loading members...
                  </div>
                </TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-gray-400"
                >
                  {isSearching
                    ? "No members found matching your search."
                    : "No members found."}
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow
                  key={member.id}
                  className="border-gray-700 table-row-hover"
                >
                  <TableCell className="font-medium text-yellow-400 min-w-[120px] w-[140px]">
                    {member.name}
                  </TableCell>
                  <TableCell className="min-w-[140px] w-[160px]">
                    {getVerificationBadge(member.verificationStatus)}
                  </TableCell>
                  <TableCell className="text-[#667085] min-w-[80px] w-[100px]">
                    {member.depositsCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-[#667085] min-w-[180px] w-[220px]">
                    {member.emailAddress}
                  </TableCell>
                  <TableCell className="text-[#667085] min-w-[140px] w-[160px]">
                    {member.mobileNumber}
                  </TableCell>
                  <TableCell className="text-[#667085] min-w-[120px] w-[140px]">
                    {member.domain}
                  </TableCell>
                  <TableCell className="text-[#667085] min-w-[120px] w-[140px]">
                    {formatDate(member.dateTimeCreated)}
                  </TableCell>
                  <TableCell className="min-w-[100px] w-[120px]">
                    {getStatusBadge(member.status)}
                  </TableCell>
                  <TableCell className="text-[#667085] min-w-[120px] w-[140px]">
                    {formatDateTime(member.dateTimeLastActive)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end py-3 gap-2 px-4 bg-[#0C1820]">
        <div className="flex items-center gap-2">
          <Select
            value={entriesPerPage.toString()}
            onValueChange={(value) => setEntriesPerPage(Number(value))}
          >
            <SelectTrigger className="w-auto bg-transparent border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2a3441] border-gray-600">
              <SelectItem value="10" className="text-white hover:bg-gray-700">
                10 Entries
              </SelectItem>
              <SelectItem value="25" className="text-white hover:bg-gray-700">
                25 Entries
              </SelectItem>
              <SelectItem value="50" className="text-white hover:bg-gray-700">
                50 Entries
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={handlePrevPage}
            disabled={currentPage === 1 || loading || isSearching}
            className="bg-transparent border-gray-600 text-white hover:bg-gray-700 rounded-r-none"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <span className="text-gray-400 text-sm px-4">Page {currentPage}</span>

          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={!hasNextPage || loading || isSearching}
            className="bg-transparent border-gray-600 text-white hover:bg-gray-700 rounded-l-none"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
