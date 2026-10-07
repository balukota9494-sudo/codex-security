import React from "react";
import {
  GraduationCap,
  ShieldAlert,
  Key,
  Smartphone,
  Share2,
  Lock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export const LearnPage: React.FC = () => {
  const topics = [
    {
      title: "Spotting Phishing & Fake Websites",
      icon: ShieldAlert,
      color: "text-amber-500",
      desc: "Scammers create lookalike websites (e.g. replacing letters with numbers like 'paypa1.com') to trick you into entering logins. Always inspect the exact spelling in your browser address bar.",
      tips: [
        "Check domain spelling carefully before typing your password.",
        "Look for artificial urgency like 'Account suspended in 24 hours!'.",
        "Never click password reset links sent through direct messages or SMS.",
      ],
    },
    {
      title: "Password Strength & Multi-Factor Authentication (MFA)",
      icon: Key,
      color: "text-blue-500",
      desc: "Using the same password on multiple websites is dangerous. If one site gets breached, attackers test that password everywhere. Use an authenticator app for MFA wherever possible.",
      tips: [
        "Use passphrases made of 4 or more random words.",
        "Never reuse passwords between your email and gaming/social accounts.",
        "Turn on Two-Factor Authentication (2FA) with an app, not just SMS.",
      ],
    },
    {
      title: "Social Engineering & Direct Message Scams",
      icon: AlertTriangle,
      color: "text-red-500",
      desc: "Attackers pretend to be friends whose accounts were hacked, influencers giving away free items, or gaming support staff. They will ask for an OTP or 'verification code'.",
      tips: [
        "Never share an SMS or WhatsApp verification code with anyone—even friends.",
        "If a friend asks for money or codes, call them directly on the phone to verify.",
        "Real game support or platform admins will NEVER ask for your password.",
      ],
    },
    {
      title: "Oversharing & Digital Footprint Privacy",
      icon: Share2,
      color: "text-emerald-500",
      desc: "Posting boarding passes, school IDs, home addresses, or pet names gives identity thieves the answers to your security questions.",
      tips: [
        "Never post photos of physical badges, IDs, or flight boarding passes.",
        "Keep your social accounts set to private / friends-only.",
        "Avoid posting your current live location until after you leave.",
      ],
    },
    {
      title: "Unsafe App Downloads & Sideloading",
      icon: Smartphone,
      color: "text-purple-500",
      desc: "Modded APKs, game hacks, or free premium software often bundle spyware or keyloggers that record every keystroke and message.",
      tips: [
        "Download software and apps only from official verified stores.",
        "Review app permissions—a flashlight app does not need your microphone or contacts.",
        "Never disable your device's built-in security scanner to install a file.",
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              SAFETY LEARNING HUB
            </h1>
            <span className="text-xs text-muted-foreground">
              Actionable digital safety guides for teens, students &amp; families
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Learn how to recognize online scams, protect your privacy, and stay safe on social media and gaming platforms. No trackers or analytics are used in Teen Safety Mode.
        </p>
      </div>

      {/* Topic Cards */}
      <div className="space-y-6">
        {topics.map((topic, idx) => {
          const Icon = topic.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-3xl border border-border bg-card/80 backdrop-blur-sm shadow-sm space-y-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center font-bold shrink-0">
                  <Icon className={`w-5 h-5 ${topic.color}`} />
                </div>
                <h2 className="text-lg font-black text-foreground leading-tight">
                  {topic.title}
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
                {topic.desc}
              </p>

              <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary block">
                  Key Safety Habits:
                </span>
                <ul className="space-y-1.5 text-xs text-muted-foreground font-medium">
                  {topic.tips.map((tip, tIdx) => (
                    <li key={tIdx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
