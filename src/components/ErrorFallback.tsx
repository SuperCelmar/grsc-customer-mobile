export function ErrorFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F5EFE9] px-4">
      <div className="bg-white border border-[#E8DDD0] rounded-[6px] p-8 max-w-sm w-full text-center">
        <p className="text-[#1A1410] font-medium mb-2">Something went wrong.</p>
        <p className="text-[#6B6560] text-sm mb-6">Please reload the page to continue.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#D4A574] text-white text-sm font-medium px-6 py-2 rounded-[6px] hover:opacity-90 transition-opacity"
        >
          Reload
        </button>
      </div>
    </div>
  )
}
