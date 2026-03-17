export default function InstructionModal({ isOpen, onClose }) {

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

      <div className="relative w-[600px] p-12 scroll-theme">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-6 text-xl text-gray-300 hover:text-white"
        >
          ✕
        </button>

        <h2 className="text-2xl font-semibold text-[#c89b3c] mb-6 text-center">
          How to Use the Draft Analyzer
        </h2>

        <ol className="list-disc space-y-3 text-gray-300 leading-relaxed" >
            <li>
            <span className="text-[#c89b3c]">Click the role</span> for which you want to recommend the champion and Lock It .
            </li>

          <li>
            Select champions for your team and the enemy team using the champion grid other than your locked role.
          </li>

          <li>
            Drag and drop champions into the role slots:
            <span className="text-[#c89b3c]"> Top, Jungle, Mid, ADC, Support</span>.
          </li>
          <li>
            Press <span className="text-[#c89b3c]">Recommend</span> to generate picks.
          </li>

          <li>
            The system simulates candidate champions and returns those that maximize predicted win probability.
          </li>
          <li>
            You can hover on the recommended champions to see their predicted win rates and how they interact with your current picks and bans.
          </li>
          

        </ol>

      </div>

    </div>
  );
}