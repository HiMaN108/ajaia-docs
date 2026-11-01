import { Icon } from "../Icon";

const ROLES = [
  { role: "Owner", icon: "shield_person", text: "Edits, shares, changes roles and deletes." },
  { role: "Editor", icon: "edit", text: "Edits the content and title." },
  { role: "Viewer", icon: "visibility", text: "Reads the document, can't change it." },
];

/** Explains the real sharing model (in place of marketing callouts in the mockup). */
export function SharingGuide() {
  return (
    <section className="card relative mt-8 overflow-hidden p-6">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-primary-container" />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-fixed text-primary">
            <Icon name="group_add" className="text-[26px]" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-on-surface">Work on documents together</h2>
            <p className="mt-1 max-w-md text-xs text-on-surface-variant">
              Open a document you own and click <strong>Share</strong> to give a teammate access by email.
            </p>
          </div>
        </div>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {ROLES.map((r) => (
            <li key={r.role} className="flex items-start gap-2 rounded-lg bg-surface-container-low p-3">
              <Icon name={r.icon} className="mt-0.5 text-[16px] text-primary" />
              <div>
                <p className="font-display text-xs font-semibold text-on-surface">{r.role}</p>
                <p className="text-[11px] text-on-surface-variant">{r.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
