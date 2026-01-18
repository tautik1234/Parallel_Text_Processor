import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BoltIcon, ChartBarIcon, CircleStackIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

const Home: React.FC = () => {
  // --- DATA: MODULES (Based on "Modules to be Implemented") ---
  const features = [
    {
      name: 'Text Breaker & Loader',
      description: 'Breaks text using multi-tasking groups and uses patterns for first-pass filtering.',
      icon: BoltIcon,
    },
    {
      name: 'Rule Checker & Scorer',
      description: 'Scores tasks simultaneously using rule-based logic and saves results to the database.',
      icon: ChartBarIcon,
    },
    {
      name: 'Search & File Saver',
      description: 'Enables searching, CSV exports for batch checks, and sends automated email summaries.',
      icon: ArrowUpTrayIcon,
    },
    {
      name: 'Text Storage Improver',
      description: 'Builds and maintains optimized lists, handling data changes with minimal overhead.',
      icon: CircleStackIcon,
    },
  ];

  // --- DATA: WORKFLOW ---
  const workflowSteps = [
    { number: '01', title: 'INIT_UPLOAD', description: 'Ingest TXT/CSV datasets.' },
    { number: '02', title: 'FORK_PROCESS', description: 'Distribute across worker nodes.' },
    { number: '03', title: 'RUN_ANALYSIS', description: 'Compute sentiment vectors.' },
    { number: '04', title: 'DB_COMMIT', description: 'Persist structured results.' },
    { number: '05', title: 'EXPORT_DATA', description: 'Generate CSV reports.' },
  ];

  // --- DATA: STATS ---
  const stats = [
    { label: 'Files_Parsed', value: '1,024+' },
    { label: 'Lines_Scanned', value: '10M+' },
    { label: 'Throughput', value: '10x' },
    { label: 'Precision', value: '99.9%' },
  ];

  // --- DATA: TEAM ---
  const teamMembers = [
    {
      name: 'Shaik Hameeda Parvin',
      role: 'Project Leader & Database',
      description: 'Leads the project roadmap and designs scalable MongoDB schemas for high-performance storage.',
      initials: 'SH',
      color: 'bg-purple-600',
    },
    {
      name: 'Sneha Hattaraki',
      role: 'Frontend Developer',
      description: 'Designed the React UI with a focus on clean layouts, animations, and responsive design.',
      initials: 'SN',
      color: 'bg-pink-600',
    },
    {
      name: 'Thirupathi Sindhu',
      role: 'Frontend Developer',
      description: 'Develops interactive dashboard components and ensures seamless API integration.',
      initials: 'TS',
      color: 'bg-blue-600',
    },
    {
      name: 'V Rishitha',
      role: 'Algorithm Specialist (ML)',
      description: 'Works on sentiment analysis rules, pattern matching logic, and ML optimization.',
      initials: 'VR',
      color: 'bg-green-600',
    },
    {
      name: 'Devisri Vutukuri',
      role: 'Gen AI / AI Engineer',
      description: 'Implements Generative AI features for summarization and intelligent text insights.',
      initials: 'DV',
      color: 'bg-yellow-600',
    },
    {
      name: 'Tautik Venkata Siva Sai Penumudi',
      role: 'Backend Developer',
      description: 'Builds the Python backend with parallel processing and API handling.',
      initials: 'TP',
      color: 'bg-red-600',
    },
  ];

  // --- DATA: MILESTONES (Updated from your Prompt) ---
  const projectMilestones = [
    {
      title: 'Start and Learn',
      description: 'Set up tools, teach multi-tasking and patterns, and plan text setups. Prepare Python with database.',
      date: 'Weeks 1-2',
    },
    {
      title: 'Module 1: Text Breaker & Loader',
      description: 'Make loading simultaneous. Build group breaking and test with big texts.',
      date: 'Weeks 3-4',
    },
    {
      title: 'Module 2 & 3: Checker & Saver',
      description: 'Add checking, searching, and scoring rules. Create checkers with CSV saves and email alerts.',
      date: 'Weeks 5-6',
    },
    {
      title: 'Module 4: Storage Improver Launch',
      description: 'Add improving logic, make lists, check speed, and finish the processor.',
      date: 'Weeks 7-8',
    },
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-sans text-gray-900 dark:text-gray-200 transition-colors duration-300">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-gray-200 dark:border-slate-900">
        <div className="absolute inset-0 z-0 opacity-10 dark:opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#4F46E5 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <main className="mt-16 mx-auto max-w-7xl px-4 sm:mt-24 sm:px-6 lg:px-8 pb-16 text-center">
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block py-1 px-3 rounded-full bg-indigo-100 dark:bg-green-900/30 text-indigo-700 dark:text-green-400 text-xs font-mono font-bold tracking-wider mb-6">
                v1.0.0 RELEASE :: STABLE
              </span>
              <h1 className="text-5xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-6xl md:text-7xl mb-6">
                <span className="block">Python Parallel</span>
                <span className="block text-indigo-600 dark:text-green-500 font-mono">Text_Processor</span>
              </h1>
              <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-slate-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl font-light">
                High-performance distributed computing architecture for large-scale text analysis. 
                Built for data scientists who demand speed.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center gap-4"
            >
              <Link
                to="/signup"
                className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-mono font-bold rounded-md text-white bg-indigo-600 dark:bg-green-600 hover:bg-indigo-700 dark:hover:bg-green-500 md:py-4 md:text-lg transition-all shadow-lg dark:shadow-[0_0_20px_rgba(74,222,128,0.3)]"
              >
                &gt; GET_STARTED
              </Link>
              <Link
                to="/login"
                className="flex items-center justify-center px-8 py-3 border border-gray-300 dark:border-slate-700 text-base font-mono font-bold rounded-md text-indigo-600 dark:text-green-400 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 md:py-4 md:text-lg transition-all"
              >
                :: LOGIN
              </Link>
            </motion.div>
          </main>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl font-bold font-mono text-indigo-600 dark:text-green-500">{stat.value}</div>
                <div className="mt-1 text-xs font-mono uppercase text-gray-500 dark:text-slate-500 tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Features/Modules Grid */}
      <div className="py-20 bg-gray-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base text-indigo-600 dark:text-green-500 font-mono font-semibold tracking-wide uppercase">Core_Modules</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              System Capabilities
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative bg-white dark:bg-slate-900 p-6 rounded-lg border border-gray-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-green-500 transition-colors group"
              >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-indigo-50 dark:bg-slate-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <feature.icon className="h-8 w-8 text-indigo-600 dark:text-green-500" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-bold font-mono text-gray-900 dark:text-white">{feature.name}</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Workflow - The Pipeline */}
      <div className="py-16 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Execution Pipeline</h2>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 dark:bg-slate-800 transform -translate-y-1/2"></div>
            
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 relative z-10">
              {workflowSteps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-indigo-600 dark:bg-slate-800 border-2 border-indigo-600 dark:border-green-500 rounded-full text-white dark:text-green-500 font-mono font-bold text-lg mb-4 shadow-lg dark:shadow-[0_0_15px_rgba(74,222,128,0.2)]">
                    {step.number}
                  </div>
                  <h3 className="text-sm font-bold font-mono text-gray-900 dark:text-white uppercase">{step.title}</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-500 max-w-[150px]">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- INTEGRATED ABOUT US SECTION --- */}
      
      {/* Project Overview */}
      <div className="bg-gray-50 dark:bg-slate-950 py-16 border-t border-gray-200 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Project Overview</h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 dark:text-slate-400">
              Architecture & Outcomes
            </p>
          </motion.div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-green-900/10 border border-gray-100 dark:border-slate-800 p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold font-mono text-gray-900 dark:text-white mb-6">Mission_Statement</h3>
                <p className="text-gray-600 dark:text-slate-400 mb-4 leading-relaxed">
                  This project focuses on making a text handling processor that works at the same time, using 
                  Python's multi-tasking for breaking up text, a module for simple pattern finding, and a 
                  simple database for text storage.
                </p>
                <p className="text-gray-600 dark:text-slate-400 mb-4 leading-relaxed">
                  The system handles big text sets, runs tasks at the same time like scoring feelings with 
                  rule-based rules, and makes searchable lists. It helps language experts and data workers 
                  mine text well without special text tools.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-bold font-mono text-gray-900 dark:text-white mb-6">Key_Outcomes</h3>
                <ul className="space-y-4">
                  {[
                    'Easy to grow handling of text for quick checks.',
                    'Rule-based scoring of feelings and patterns that works right.',
                    'Stored text that\'s easy to search for info.',
                    'Better text work with auto alerts and email summaries.',
                  ].map((outcome, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="flex-shrink-0 h-6 w-6 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="ml-3 text-gray-600 dark:text-slate-400">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Grid */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
        >
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white font-mono">CORE_TEAM</h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-slate-400">
                The minds behind the code
            </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-green-900/10 overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-slate-800"
            >
              <div className="p-8">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${member.color} rounded-xl w-16 h-16 flex items-center justify-center shadow-lg`}>
                    <span className="text-white text-xl font-bold font-mono">{member.initials}</span>
                  </div>
                  <div className="ml-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white font-mono">{member.name}</h3>
                    <p className="text-sm text-indigo-600 dark:text-green-400 font-semibold mt-1 font-mono uppercase">{member.role}</p>
                  </div>
                </div>
                <p className="mt-6 text-gray-600 dark:text-slate-400 text-sm leading-relaxed">{member.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Project Milestones */}
      <div className="py-16 bg-gray-50 dark:bg-slate-950 border-t border-gray-200 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white font-mono">DEVELOPMENT_LOG</h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 dark:text-slate-400">
              Our roadmap to completion
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gray-200 dark:bg-slate-800" />

            <div className="space-y-12">
              {projectMilestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative flex items-center ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 md:left-1/2 md:transform md:-translate-x-1/2 flex items-center justify-center w-8 h-8 bg-indigo-600 dark:bg-slate-800 border-2 border-indigo-600 dark:border-green-500 rounded-full z-10">
                    <div className="w-2 h-2 bg-white dark:bg-green-500 rounded-full" />
                  </div>

                  {/* Content */}
                  <div className={`md:w-1/2 ${
                    index % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16'
                  }`}>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-slate-800">
                      <div className={`flex items-center justify-between mb-4 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold font-mono bg-indigo-100 dark:bg-green-900/30 text-indigo-800 dark:text-green-400">
                          {milestone.date}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-mono">{milestone.title}</h3>
                      <p className="text-gray-600 dark:text-slate-400 text-sm">{milestone.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="py-16 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white font-mono">TECH_STACK</h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 dark:text-slate-400">
              Modern tools for maximum efficiency
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { name: 'React', description: 'UI Framework', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
              { name: 'TypeScript', description: 'Type Safety', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
              { name: 'Node.js', description: 'Backend API', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
              { name: 'Python', description: 'Processing', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
              { name: 'MongoDB', description: 'NoSQL DB', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
              { name: 'Docker', description: 'Container', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
            ].map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 dark:bg-slate-800 rounded-xl p-6 text-center hover:bg-white dark:hover:bg-slate-700 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-slate-600"
              >
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold font-mono ${tech.color} mb-4`}>
                  {tech.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-slate-400 font-mono">{tech.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer - System Info */}
      <footer className="bg-gray-900 dark:bg-slate-950 border-t border-gray-800 dark:border-slate-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-mono text-gray-500">
            SYSTEM_STATUS: ONLINE | REGION: AP-SOUTH-1 | LATENCY: 24ms
          </p>
          <p className="mt-2 text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Python Parallel Text Processor. Engineered for excellence.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;