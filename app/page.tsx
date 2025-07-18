import MembersTable from "@/components/members-table";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A1117] text-white">
      <div className="container mx-auto py-8 px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white mb-2">Members</h1>
          <p className="text-[#A3A3A3] text-sm">View your members here.</p>
        </div>
        <MembersTable />
      </div>
    </div>
  );
}
