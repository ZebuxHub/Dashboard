import { 
  SparklesIcon, 
  ShieldCheckIcon, 
  ChartBarIcon, 
  DevicePhoneMobileIcon,
  ClockIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const About = () => {
  const features = [
    {
      name: 'Real-time Sync',
      description: 'Automatic data synchronization every 5 minutes with your game progress.',
      icon: ClockIcon,
      color: 'text-blue-400'
    },
    {
      name: 'Secure & Private',
      description: 'Your data is encrypted and secure. Only you can access your information.',
      icon: ShieldCheckIcon,
      color: 'text-green-400'
    },
    {
      name: 'Beautiful Analytics',
      description: 'Track your progress with stunning charts and detailed statistics.',
      icon: ChartBarIcon,
      color: 'text-purple-400'
    },
    {
      name: 'Mobile Friendly',
      description: 'Access your dashboard from any device, anywhere, anytime.',
      icon: DevicePhoneMobileIcon,
      color: 'text-pink-400'
    },
    {
      name: 'Multi-Game Support',
      description: 'Designed to work with multiple games and expand over time.',
      icon: GlobeAltIcon,
      color: 'text-yellow-400'
    },
    {
      name: 'Advanced Features',
      description: 'Historical data, notifications, and much more coming soon.',
      icon: SparklesIcon,
      color: 'text-indigo-400'
    }
  ];

  const stats = [
    { name: 'Active Users', value: '1,200+' },
    { name: 'Data Points Tracked', value: '50M+' },
    { name: 'Uptime', value: '99.9%' },
    { name: 'Games Supported', value: '5+' }
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6">
          <SparklesIcon className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Zebux Dashboard
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          The ultimate game data tracking platform. Monitor your progress, analyze your performance, 
          and stay connected with your gaming achievements in real-time.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="glass-card p-6 rounded-xl border border-white/10 text-center">
            <p className="text-3xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-gray-400 mt-1">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Features Grid */}
      <div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Why Choose Zebux?</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Built with modern technology and designed for gamers who want to track their progress 
            and achievements across multiple games.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="glass-card p-6 rounded-xl border border-white/10">
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-lg bg-white/10">
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white ml-3">{feature.name}</h3>
                </div>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* How It Works */}
      <div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Get started in just a few simple steps and begin tracking your game data immediately.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Generate Token',
              description: 'Create a secure API token with your Roblox username to identify your data.'
            },
            {
              step: '02',
              title: 'Run Script',
              description: 'Execute our Lua script in your game executor to start syncing your data.'
            },
            {
              step: '03',
              title: 'Track Progress',
              description: 'Monitor your real-time progress on the beautiful dashboard interface.'
            }
          ].map((step, index) => (
            <div key={index} className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">{step.step}</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Technology Stack */}
      <div className="glass-card p-8 rounded-xl border border-white/10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Built with Modern Technology</h2>
          <p className="text-gray-400">
            Zebux Dashboard is built using cutting-edge technologies to ensure the best performance and user experience.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: 'React', desc: 'Frontend Framework' },
            { name: 'TypeScript', desc: 'Type Safety' },
            { name: 'Node.js', desc: 'Backend Runtime' },
            { name: 'SQLite', desc: 'Database' },
            { name: 'Socket.IO', desc: 'Real-time Updates' },
            { name: 'Tailwind CSS', desc: 'Styling' },
            { name: 'Railway', desc: 'Deployment' },
            { name: 'Lua', desc: 'Game Integration' }
          ].map((tech, index) => (
            <div key={index} className="text-center p-4 rounded-lg hover:bg-white/5 transition-colors">
              <h4 className="font-semibold text-white">{tech.name}</h4>
              <p className="text-sm text-gray-400 mt-1">{tech.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact & Support */}
      <div className="glass-card p-8 rounded-xl border border-white/10">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Need Help?</h2>
          <p className="text-gray-400 mb-6">
            Our team is here to help you get the most out of Zebux Dashboard.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h3 className="font-semibold text-white mb-2">Documentation</h3>
              <p className="text-sm text-gray-400">
                Comprehensive guides and API documentation
              </p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-white mb-2">Community</h3>
              <p className="text-sm text-gray-400">
                Join our Discord server for support and updates
              </p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-white mb-2">Updates</h3>
              <p className="text-sm text-gray-400">
                Regular updates with new features and improvements
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-white/10">
        <p className="text-gray-400">
          © 2025 Zebux Dashboard. Built with ❤️ for the gaming community.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Version 1.0.0 • Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default About;
