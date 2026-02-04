
import { ArrowRight, BookOpen, Users, Award, Lightbulb, GraduationCap } from 'lucide-react';

const tools = [
  { icon: BookOpen, label: 'Liberation-focused learning modules', description: 'Cooperative ownership, digital sovereignty, trauma-informed care' },
  { icon: Users, label: 'Skill Exchange marketplace', description: 'Share and learn skills through mutual aid' },
  { icon: Award, label: 'Certificates & progress tracking', description: 'Earn verifiable credentials as you learn' },
  { icon: Lightbulb, label: 'IVOR learning assistant', description: 'AI-guided conversational lessons' },
];

export function LearningWidget() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900">
            Learning & Self-Improvement
          </h2>
          <p className="text-gray-500 text-sm">
            Grow with purpose, rooted in liberation values
          </p>
        </div>
      </div>

      <p className="text-gray-700 mb-6 leading-relaxed">
        Build skills that matter to our communities. From cooperative ownership to digital sovereignty,
        our learning platform centres Black queer knowledge and mutual aid.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {tools.map((tool) => (
          <div
            key={tool.label}
            className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100"
          >
            <tool.icon className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">{tool.label}</p>
              <p className="text-gray-500 text-xs mt-0.5">{tool.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href="https://blkoutuk.com?tab=learning"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 group"
        >
          Start Learning
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </a>
        <a
          href="https://blkoutuk.com?tab=learning&view=skills"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 border border-emerald-200"
        >
          <Users size={18} />
          Skill Exchange
        </a>
      </div>
    </div>
  );
}
