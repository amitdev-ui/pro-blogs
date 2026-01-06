export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full border rounded p-6 space-y-4">
        <h2 className="text-xl font-semibold">Admin page not found</h2>
        <p className="text-sm text-gray-600">
          The page you are looking for does not exist.
        </p>
        <a href="/admin" className="px-4 py-2 bg-black text-white rounded inline-block">
          Go to admin home
        </a>
      </div>
    </div>
  );
}

