
import { MessageSquare, Zap, BarChart3, Users, Bot, Shield } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Bot,
      title: "AI-Powered Chatbots",
      description: "Create intelligent chatbots that handle customer queries 24/7 with natural language processing."
    },
    {
      icon: Zap,
      title: "Instant Automation",
      description: "Set up automated workflows in minutes. No coding required - just drag, drop, and deploy."
    },
    {
      icon: Users,
      title: "Contact Management",
      description: "Organize contacts with tags, segments, and custom fields for targeted messaging campaigns."
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Track message delivery, response rates, and customer engagement with detailed analytics."
    },
    {
      icon: MessageSquare,
      title: "Broadcast Campaigns",
      description: "Send targeted messages to thousands of customers with personalized content and scheduling."
    },
    {
      icon: Shield,
      title: "WhatsApp Compliance",
      description: "Stay compliant with WhatsApp Business API policies and maintain your sender reputation."
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Scale
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Powerful features designed to help businesses of all sizes automate their WhatsApp communication and grow faster.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group p-8 rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all duration-300 bg-white hover:bg-green-50/50"
            >
              <div className="w-14 h-14 bg-green-100 group-hover:bg-green-200 rounded-2xl flex items-center justify-center mb-6 transition-colors">
                <feature.icon className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
