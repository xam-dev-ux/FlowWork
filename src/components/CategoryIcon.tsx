import { TaskCategory } from "@/types";

interface CategoryIconProps {
  category: TaskCategory;
}

export default function CategoryIcon({ category }: CategoryIconProps) {
  const getIcon = () => {
    switch (category) {
      case TaskCategory.Copywriting:
        return "✍️";
      case TaskCategory.CodeReview:
        return "💻";
      case TaskCategory.DataAnalysis:
        return "📊";
      case TaskCategory.ImagePrompts:
        return "🎨";
      case TaskCategory.Research:
        return "🔍";
      case TaskCategory.Translation:
        return "🌐";
      case TaskCategory.SocialMedia:
        return "📱";
      case TaskCategory.Financial:
        return "💰";
      case TaskCategory.Legal:
        return "⚖️";
      default:
        return "📦";
    }
  };

  return <span className="text-lg">{getIcon()}</span>;
}
