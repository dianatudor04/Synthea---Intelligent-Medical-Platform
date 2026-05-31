import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '../ui/button';

interface BlogPost {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
}

export function BlogSection() {
  const navigate = useNavigate();

  const posts: BlogPost[] = [
    {
      id: '1',
      title: '10 Heart-Healthy Foods',
      description:
        'Discover the best foods to improve cardiovascular health and reduce risk.',
      category: 'Nutrition',
      image: 'https://images.unsplash.com/photo-1651352650142-385087834d9d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    },
    {
      id: '2',
      title: 'Managing Stress & Anxiety',
      description:
        'Practical tips and techniques for better mental health every day.',
      category: 'Mental Health',
      image: 'https://images.unsplash.com/photo-1674505520294-640e2382f525?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    },
    {
      id: '3',
      title: 'Benefits of Daily Exercise',
      description:
        'Learn how 30 minutes of activity can transform your overall wellness.',
      category: 'Lifestyle',
      image: 'https://images.unsplash.com/photo-1773681823208-7f3657c0688f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">
          Wellness Blog
        </h3>
        <Button
          onClick={() => navigate('/patient/blog')}
          variant="ghost"
          size="sm"
          className="text-[#3A7BD5] gap-1 hover:gap-2 transition-all"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {posts.map((post, index) => {
          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              onClick={() => navigate('/patient/blog')}
              className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-lg transition-all border border-gray-100"
            >
              <div className="h-40 overflow-hidden relative">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <div className="p-5">
                <div className="mb-2">
                  <span className="text-xs font-medium text-[#3A7BD5] bg-[#E6F0FA] px-2 py-1 rounded-full">
                    {post.category}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {post.title}
                </h4>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {post.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
