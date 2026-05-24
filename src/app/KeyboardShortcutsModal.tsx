import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

const SHORTCUTS = [
  {
    section: "Navigation",
    items: [
      { keys: ["/"], description: "Open search" },
      { keys: ["⌘", "K"], description: "Open search" },
      { keys: ["N"], description: "New board" },
      { keys: ["?"], description: "Show keyboard shortcuts" },
    ],
  },
  {
    section: "Board",
    items: [
      { keys: ["Esc"], description: "Close modal / cancel edit" },
      { keys: ["Enter"], description: "Save inline edit" },
    ],
  },
];

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex min-w-[24px] items-center justify-center rounded-md border border-white/[0.12] bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-medium text-white/70">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsModal({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] border-0 bg-transparent p-0 shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div
          className="fb-glass-strong fb-ring-inner overflow-hidden rounded-2xl"
          style={{ boxShadow: "0 25px 60px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.1)" }}
        >
          <div className="h-[3px] bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-500" />
          <div className="px-6 py-5">
            <h2 className="mb-5 text-[16px] font-semibold text-white">Keyboard shortcuts</h2>
            <div className="space-y-5">
              {SHORTCUTS.map((section) => (
                <div key={section.section}>
                  <div className="mb-2 text-[10.5px] font-semibold tracking-[0.14em] text-white/35 uppercase">
                    {section.section}
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <div
                        key={item.description}
                        className="flex items-center justify-between rounded-lg px-2 py-1.5 transition hover:bg-white/[0.03]"
                      >
                        <span className="text-[13px] text-white/70">{item.description}</span>
                        <div className="flex items-center gap-1">
                          {item.keys.map((k) => (
                            <Kbd key={k}>{k}</Kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-center text-[11.5px] text-white/30">
              Press <Kbd>?</Kbd> to toggle this panel
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
