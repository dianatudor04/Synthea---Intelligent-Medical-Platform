import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Clock } from 'lucide-react';
import { useNavigate } from 'react-router';
import { trackEvent } from '../../../lib/events';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';

interface BlogPost {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  image: string;
  readTime: string;
}

// Full article bodies (shown in the expanded modal), keyed by post id.
// Paragraphs separated by blank lines.
const ARTICLE_BODIES: Record<string, string> = {
  '1': `A heart-healthy diet is one of the most powerful tools you have for protecting your cardiovascular system. The foods you eat every day directly influence your cholesterol levels, blood pressure, and the health of your arteries.

Start with fatty fish such as salmon, mackerel, and sardines. These are rich in omega-3 fatty acids, which help lower triglycerides and reduce inflammation in the blood vessels. Aim for two servings per week.

Leafy greens like spinach, kale, and Swiss chard are loaded with vitamin K and dietary nitrates, which support healthy blood vessels and may help lower blood pressure. Whole grains — oats, barley, and brown rice — provide soluble fiber that helps reduce LDL ("bad") cholesterol.

Don't forget berries, nuts, and olive oil. Blueberries and strawberries are packed with antioxidants called anthocyanins; a small handful of walnuts or almonds each day supports healthy cholesterol; and replacing butter with extra-virgin olive oil is a simple swap with real benefits.

Small, consistent changes add up. You don't need to overhaul everything at once — adding one heart-healthy food at a time is a sustainable way to build lasting habits. As always, talk to your doctor before making major dietary changes, especially if you have an existing heart condition.`,
  '2': `Stress and anxiety are natural responses to life's pressures, but when they become constant they can affect both your mental and physical health. The good news is that several evidence-based techniques can help you regain a sense of calm.

Begin with your breath. Slow, paced breathing — inhaling for four counts, holding for four, and exhaling for six — activates the body's relaxation response and can lower your heart rate within minutes. Practising this for just five minutes a day builds resilience over time.

Mindfulness meditation trains your attention to stay in the present moment rather than spiralling into worry about the future. Even short, guided sessions can reduce the intensity of anxious thoughts. Pair this with regular physical activity, which releases endorphins and is one of the most effective natural mood regulators.

Sleep is foundational. A consistent sleep schedule, a dark and cool bedroom, and avoiding screens before bed all improve sleep quality, which in turn lowers baseline anxiety. Limiting caffeine and alcohol also makes a noticeable difference.

Finally, connection matters. Talking with friends, family, or a professional can put worries into perspective and remind you that you're not alone. If anxiety begins to interfere with daily life, reaching out to a licensed mental-health professional is a sign of strength, not weakness.`,
  '3': `Regular physical activity is one of the closest things we have to a miracle drug. Just 30 minutes of moderate movement most days of the week can transform your overall health and well-being.

Your heart benefits first. Exercise strengthens the heart muscle, improves circulation, and helps maintain healthy blood pressure and cholesterol levels — significantly reducing your risk of heart disease and stroke.

Movement also builds and preserves muscle and bone, which becomes increasingly important as we age. Weight-bearing activities like walking, jogging, and resistance training help keep bones dense and joints stable, lowering the risk of falls and fractures later in life.

The mental benefits are just as striking. Exercise boosts mood through the release of endorphins, sharpens focus, and improves sleep quality. Many people find that a brisk daily walk is as effective for stress relief as it is for physical fitness.

You don't need a gym membership or hours of free time. Taking the stairs, walking during phone calls, gardening, or dancing in your living room all count. The best exercise is the one you'll actually enjoy and keep doing.`,
  '4': `A balanced diet provides your body with the right mix of nutrients to function at its best. Rather than following restrictive fad diets, focus on building sustainable eating patterns around whole, minimally processed foods.

Macronutrients are the foundation. Proteins (from beans, fish, poultry, eggs, and dairy) repair tissue and keep you full; complex carbohydrates (whole grains, vegetables, and fruit) provide steady energy; and healthy fats (olive oil, nuts, avocado) support brain health and hormone balance.

Micronutrients matter too. A colourful plate is usually a nutritious one — different colours of fruit and vegetables signal different vitamins, minerals, and antioxidants. Aim to fill half your plate with vegetables and fruit at most meals.

Portion awareness is more useful than strict calorie counting for most people. Eating slowly, stopping when you feel comfortably full, and keeping sugary drinks and ultra-processed snacks to a minimum naturally helps with weight management.

Stay hydrated and be kind to yourself. Water supports nearly every process in the body, and a balanced approach that allows occasional treats is far easier to maintain than an all-or-nothing diet. Consistency over time beats perfection.`,
  '5': `An active lifestyle isn't only about scheduled workouts — it's about weaving movement into the fabric of your day. These small bursts of activity, sometimes called "incidental exercise," add up to substantial health benefits.

Every time you take the stairs instead of the lift, walk to a colleague's desk rather than messaging, or stretch during a break, you improve your circulation and keep your metabolism active. These moments counteract the harms of prolonged sitting, which research links to a range of health problems.

Standing and moving regularly also supports better posture, reduces stiffness, and keeps energy levels steady throughout the day. Many people notice improved focus and mental clarity after even a short walk.

Try setting gentle reminders to stand up every hour, taking walking meetings, or parking a little farther away. Over a week, these choices can add thousands of extra steps without requiring any dedicated workout time.

The key is consistency. An active lifestyle is sustainable precisely because it doesn't depend on willpower-heavy gym sessions — it's built from dozens of easy, repeatable choices that gradually become second nature.`,
  '6': `Mindful living means bringing gentle, non-judgemental awareness to your everyday experiences. It's a simple practice with profound effects on stress, focus, and overall well-being.

Present-moment awareness is the core skill. Instead of running on autopilot, you pause to notice what's actually happening — the taste of your food, the sensation of your breath, the sounds around you. This anchors your attention and quiets the mental chatter that fuels stress.

Gratitude journaling is a powerful companion practice. Writing down a few things you're thankful for each day trains your mind to notice the positive, which research links to improved mood and resilience.

Mindful eating — slowing down and paying full attention to your meals — improves digestion and helps you recognise genuine hunger and fullness cues, supporting a healthier relationship with food.

You don't need hours of meditation to benefit. Even five minutes of daily practice can transform your mental well-being over time. Start small, be patient with yourself, and let mindfulness become a natural part of your routine.`,
};

export function PatientBlogPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<BlogPost | null>(null);

  // Track scroll depth (25/50/75/100% thresholds, once each) and total dwell
  // time on the blog. These feed later signal extraction about reading interest.
  useEffect(() => {
    const start = Date.now();
    const reached = new Set<number>();
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const pct = scrollable <= 0 ? 100 : Math.round((doc.scrollTop / scrollable) * 100);
      for (const t of [25, 50, 75, 100]) {
        if (pct >= t && !reached.has(t)) {
          reached.add(t);
          trackEvent('blog_scroll_depth', { depth: t });
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      trackEvent('blog_dwell', { ms: Date.now() - start });
    };
  }, []);

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
                onClick={() => {
                  trackEvent('blog_open', {
                    postId: post.id,
                    category: post.category,
                    title: post.title,
                  });
                  setSelected(post);
                }}
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

      {/* Expanded article view */}
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 gap-0">
          {selected && (
            <>
              <div className="h-56 w-full overflow-hidden rounded-t-lg">
                <img src={selected.image} alt={selected.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-semibold text-[#3A7BD5] bg-[#E6F0FA] px-3 py-1 rounded-full">
                      {selected.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" /> {selected.readTime}
                    </span>
                  </div>
                  <DialogTitle className="text-2xl font-bold text-gray-900 text-left">
                    {selected.title}
                  </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-gray-500 italic mt-2">{selected.description}</p>
                <div className="mt-4 space-y-4">
                  {(ARTICLE_BODIES[selected.id] ?? selected.content)
                    .split('\n\n')
                    .map((para, i) => (
                      <p key={i} className="text-base text-gray-700 leading-relaxed">
                        {para.trim()}
                      </p>
                    ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
