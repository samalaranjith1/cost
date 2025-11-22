import { Package, TrendingUp, Users, ShoppingCart, Clock, Shield } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      icon: Package,
      title: 'Inventory Management',
      description: 'Track stock levels in real-time, automate reordering, and reduce waste with intelligent inventory tracking.'
    },
    {
      icon: TrendingUp,
      title: 'Cost Analysis',
      description: 'Get detailed insights into your costs, identify savings opportunities, and maximize your profit margins.'
    },
    {
      icon: Users,
      title: 'Staff Management',
      description: 'Manage schedules, track hours, and streamline payroll with our comprehensive staff management tools.'
    },
    {
      icon: ShoppingCart,
      title: 'Order Management',
      description: 'Process orders efficiently, integrate with delivery platforms, and keep customers happy with faster service.'
    },
    {
      icon: Clock,
      title: 'Real-time Reports',
      description: 'Access live dashboards with key metrics, sales data, and performance insights anytime, anywhere.'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Bank-level security, automatic backups, and 99.9% uptime guarantee to keep your business running smoothly.'
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to Run Your Restaurant
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Powerful features designed to simplify operations and boost your bottom line
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-[#306dff]"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-[#306dff] to-[#5a8fff] rounded-lg flex items-center justify-center mb-6">
                  <Icon className="text-white" size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
