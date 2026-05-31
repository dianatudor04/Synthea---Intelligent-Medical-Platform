import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

interface BlogPost {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  image: string;
  readTime: string;
}

export function PatientBlogPage() {
  const navigate = useNavigate();

  const posts: BlogPost[] = [
    {
      id: '1',
      title: '10 Heart-Healthy Foods',
      description:
        'Discover the best foods to improve cardiovascular health and reduce risk.',
      content:
        'A heart-healthy diet is essential for maintaining cardiovascular health. Include fatty fish like salmon, leafy greens, whole grains, berries, and nuts in your daily meals. These foods are rich in omega-3 fatty acids, fiber, and antioxidants that protect your heart.',
      category: 'Nutrition',
      image: 'https://images.unsplash.com/photo-1651352650142-385087834d9d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      readTime: '5 min read',
    },
    {
      id: '2',
      title: 'Managing Stress & Anxiety',
      description:
        'Practical tips and techniques for better mental health every day.',
      content:
        'Practice mindfulness meditation, deep breathing exercises, regular physical activity, and maintain a consistent sleep schedule to manage stress effectively. Taking short breaks throughout the day and connecting with loved ones can significantly reduce anxiety levels.',
      category: 'Mental Health',
      image: 'https://images.unsplash.com/photo-1674505520294-640e2382f525?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      readTime: '7 min read',
    },
    {
      id: '3',
      title: 'Benefits of Daily Exercise',
      description:
        'Learn how 30 minutes of activity can transform your overall wellness.',
      content:
        'Regular exercise improves cardiovascular health, strengthens muscles, boosts mood, enhances sleep quality, and reduces the risk of chronic diseases. Even a brisk 30-minute walk can make a significant difference in your overall health and energy levels.',
      category: 'Lifestyle',
      image: 'https://images.unsplash.com/photo-1773681823208-7f3657c0688f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      readTime: '6 min read',
    },
    {
      id: '4',
      title: 'Balanced Diet Essentials',
      description:
        'Understanding macronutrients and creating a sustainable meal plan.',
      content:
        'A balanced diet includes proteins, carbohydrates, healthy fats, vitamins, and minerals in appropriate proportions for optimal health and energy. Focus on whole, unprocessed foods and stay hydrated throughout the day.',
      category: 'Nutrition',
      image: 'https://images.unsplash.com/photo-1624340209404-4f479dd59708?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      readTime: '8 min read',
    },
    {
      id: '5',
      title: 'Active Lifestyle Benefits',
      description:
        'How staying active throughout the day improves overall health.',
      content:
        'Incorporating movement into your daily routine - taking the stairs, walking meetings, stretching breaks - can dramatically improve circulation, energy, and mental clarity. Every bit of activity counts toward better health.',
      category: 'Lifestyle',
      image: 'https://images.unsplash.com/photo-1649134296132-56606326c566?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      readTime: '5 min read',
    },
    {
      id: '6',
      title: 'Mindful Living Practices',
      description:
        'Simple mindfulness techniques to incorporate into daily routines.',
      content:
        'Practice present-moment awareness, gratitude journaling, mindful eating, and regular meditation to enhance mental clarity and reduce stress. Even 5 minutes of daily mindfulness can transform your mental wellbeing.',
      category: 'Mental Health',
      image: 'https://images.unsplash.com/photo-1642557581375-4f2ba18c7cd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      readTime: '6 min read',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F0FA]/30 via-white to-[#E8F5E9]/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8 pb-24 lg:pb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={() => navigate('/patient')}
            className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:shadow-lg transition-shadow lg:hidden"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Wellness Blog
            </h1>
            <p className="text-gray-600">
              Expert tips and advice for a healthier lifestyle
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, index) => {
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="bg-white rounded-3xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-all border border-gray-100"
              >
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#3A7BD5] bg-[#E6F0FA] px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {post.readTime}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {post.description}
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                    {post.content}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
