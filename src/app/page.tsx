
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  let connectionStatus = "❌ Failed to connect";
  let tableCount = 0;
  let error: string | null = null;

  try {
    const supabase = await createClient();
    const { count, error: countError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      error = countError.message;
    } else {
      connectionStatus = "✅ Connected successfully";
      tableCount = count || 0;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error occurred";
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔗 Database Connection Test</h2>
          <div className="space-y-2">
            <p><strong>Status:</strong> {connectionStatus}</p>
            <p><strong>User profiles in database:</strong> {tableCount}</p>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mt-4">
                <p className="text-red-700"><strong>Error:</strong> {error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
