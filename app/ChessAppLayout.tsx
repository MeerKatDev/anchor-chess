import MainBoard from "./MainBoard";
import BoardsList from "./BoardsList";

export default function ChessAppLayout() {
  return (
    <div className="flex flex-row items-start gap-4 p-4">
      {/* Left: main content */}
      <div className="flex flex-col items-center gap-2 p-4 flex-2 border-1">
        <MainBoard />
      </div>
      {/* Right side: Board list */}
      <div className="flex-1 border p-4">
        <h2 className="text-lg font-bold mb-2">All Boards</h2>
        <div className="overflow-auto max-h-[600px]">
          <BoardsList />
        </div>
      </div>
    </div>
  );
}
