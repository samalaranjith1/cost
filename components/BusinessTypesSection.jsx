import { Coffee, Pizza, Utensils, IceCream } from 'lucide-react';

export default function BusinessTypesSection() {
  const businessTypes = [
    {
      icon: Coffee,
      title: 'Cafes & Coffee Shops',
      description: 'Perfect for managing your cafe operations efficiently'
    },
    {
      icon: Pizza,
      title: 'Quick Service Restaurants',
      description: 'Streamline fast-paced QSR operations'
    },
    {
      icon: Utensils,
      title: 'Fine Dining',
      description: 'Sophisticated tools for upscale establishments'
    },
    {
      icon: IceCream,
      title: 'Cloud Kitchens',
      description: 'Optimize delivery-first operations'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Built for Every Type of Restaurant
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Whether you run a small cafe or a large chain, we have the right solution for you
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {businessTypes.map((type, index) => {
            const Icon = type.icon;
            return (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-[#306dff] group"
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 group-hover:bg-[#306dff] transition-all shadow-md">
                  <Icon className="text-[#306dff] group-hover:text-white transition-all" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {type.title}
                </h3>
                <p className="text-gray-600">
                  {type.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
