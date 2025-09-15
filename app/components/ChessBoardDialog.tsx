import { Dialog } from "@headlessui/react";

export default function ChessBoardDialog({
  message,
  modalOpen,
  confirmMove,
  cancelMove,
}: {
  message: string;
  modalOpen: boolean;
  confirmMove: () => void;
  cancelMove: () => void;
}) {
  return (
    <Dialog
      open={modalOpen}
      onClose={cancelMove}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="bg-white p-6 rounded-xl">
        <Dialog.Title className="text-lg font-bold">Confirm Move</Dialog.Title>
        <Dialog.Description className="mt-2 mb-4">{message}</Dialog.Description>
        <div className="flex gap-4 justify-end">
          <button
            onClick={confirmMove}
            className="bg-green-600 text-white px-4 py-2 rounded-xl"
          >
            Confirm
          </button>
          <button
            onClick={cancelMove}
            className="bg-red-600 text-white px-4 py-2 rounded-xl"
          >
            Cancel
          </button>
        </div>
      </div>
    </Dialog>
  );
}
