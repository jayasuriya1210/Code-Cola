import { motion } from "framer-motion";

const SettingsPage = () => {
  const accountFields = [
    { label: "Full Name", val: "Alexandra Chen" },
    { label: "Email", val: "alexandra@lawfirm.in" },
    { label: "Organization", val: "Chen & Associates LLP" },
  ];

  const subscriptionFields = [
    { label: "Plan", val: "Pro — ₹4,999/month" },
    { label: "Renewal Date", val: "March 26, 2026" },
    { label: "Storage", val: "4.2 GB of 10 GB" },
  ];

  const aiPrefs = [
    { label: "Default Voice", opts: ["Professional Male", "Professional Female", "Neutral"] },
    { label: "Summary Depth", opts: ["Concise", "Standard", "Comprehensive"] },
    { label: "Audio Speed", opts: ["1×", "1.25×", "1.5×", "2×"] },
  ];

  return (
    <div className="p-7 animate-fade-in">
      <div className="mb-7">
        <h1 className="text-[22px] font-semibold tracking-tight">Settings</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Manage your account, preferences, and integrations</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {[{ title: "Account", fields: accountFields }, { title: "Subscription", fields: subscriptionFields }].map((section) => (
          <motion.div key={section.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-lg p-5">
            <div className="text-[13px] font-semibold mb-4">{section.title}</div>
            {section.fields.map((f) => (
              <div key={f.label} className="mb-4">
                <label className="block text-[11.5px] font-medium tracking-wide text-muted-foreground mb-1.5">{f.label}</label>
                <input
                  defaultValue={f.val}
                  className="w-full bg-surface border border-border rounded-md px-3.5 py-2.5 text-[13px] text-foreground outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--gold)/0.08)] placeholder:text-dim"
                />
              </div>
            ))}
            <button className="px-3 py-1.5 border border-border rounded-md text-xs text-muted-foreground hover:border-primary hover:text-primary hover:bg-gold-glow transition-all mt-1">
              Save Changes
            </button>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-lg p-5">
        <div className="text-[13px] font-semibold mb-4">AI Preferences</div>
        <div className="grid grid-cols-3 gap-4">
          {aiPrefs.map((p) => (
            <div key={p.label}>
              <label className="block text-[11.5px] font-medium tracking-wide text-muted-foreground mb-1.5">{p.label}</label>
              <select className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-[13px] text-foreground outline-none transition-all focus:border-primary">
                {p.opts.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
