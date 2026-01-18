import React from 'react';
import { motion } from 'framer-motion';

const AboutUs: React.FC = () => {
  const teamMembers = [
    {
      name: 'Shaik Hameeda Parvin',
      role: 'Project Leader & Database',
      description: 'Leads the project roadmap and designs scalable MongoDB schemas for high-performance storage.',
      initials: 'SH',
      color: 'bg-purple-500',
    },
    {
      name: 'Sneha Hattaraki',
      role: 'Frontend Developer',
      description: 'Designed the React UI with a focus on clean layouts, animations, and responsive design.',
      initials: 'SN',
      color: 'bg-pink-500',
    },
    {
      name: 'Thirupathi Sindhu',
      role: 'Frontend Developer',
      description: 'Develops interactive dashboard components and ensures seamless API integration.',
      initials: 'TS',
      color: 'bg-blue-500',
    },
    {
      name: 'V Rishitha',
      role: 'Algorithm Specialist (ML)',
      description: 'Works on sentiment analysis rules, pattern matching logic, and ML optimization.',
      initials: 'VR',
      color: 'bg-green-500',
    },
    {
      name: 'Devisri Vutukuri',
      role: 'Gen AI / AI Engineer',
      description: 'Implements Generative AI features for summarization and intelligent text insights.',
      initials: 'DV',
      color: 'bg-yellow-500',
    },
    {
      name: 'Tautik Venkata Siva Sai Penumudi',
      role: 'Backend Developer',
      description: 'Builds the Python backend with parallel processing and API handling.',
      initials: 'TP',
      color: 'bg-red-500',
    },
  ];

  const projectMilestones = [
    {
      title: 'Project Initiation',
      description: 'Research, planning, and technology stack selection.',
      date: 'Weeks 1-2',
    },
    {
      title: 'Backend Development',
      description: 'Python parallel processing engine and API development.',
      date: 'Weeks 3-4',
    },
    {
      title: 'Frontend Development',
      description: 'React dashboard, authentication, and file upload system.',
      date: 'Weeks 5-6',
    },
    {
      title: 'AI Integration',
      description: 'Sentiment analysis and machine learning model integration.',
      date: 'Weeks 7-8',
    },
    {
      title: 'Testing & Deployment',
      description: 'System testing, bug fixing, and production deployment.',
      date: 'Weeks 9-10',
    },
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header Section */}
      <div className="relative bg-indigo-700">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-800 to-purple-900 mix-blend-multiply" />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Meet Our Team
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-indigo-100">
              The passionate minds behind the{' '}
              <span className="font-semibold">Python Parallel Text Handling Processor</span>.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Team Grid */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300"
            >
              <div className="p-8">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${member.color} rounded-xl w-16 h-16 flex items-center justify-center`}>
                    <span className="text-white text-xl font-bold">{member.initials}</span>
                  </div>
                  <div className="ml-6">
                    <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-indigo-600 font-semibold mt-1">{member.role}</p>
                  </div>
                </div>
                <p className="mt-6 text-gray-600">{member.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Project Overview */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-extrabold text-gray-900">Project Overview</h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">
              Building a high-performance text processing system from the ground up
            </p>
          </motion.div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Project Statement</h3>
                <p className="text-gray-600 mb-4">
                  This project focuses on creating a text handling processor that works in parallel, 
                  using Python's multiprocessing capabilities for breaking up text, pattern finding modules, 
                  and a database for text storage.
                </p>
                <p className="text-gray-600 mb-4">
                  The system handles large text datasets, runs parallel tasks like sentiment scoring with 
                  rule-based algorithms, and creates searchable repositories. It helps language experts and 
                  data workers mine text efficiently without specialized tools.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Outcomes</h3>
                <ul className="space-y-4">
                  {[
                    'Scalable text processing for rapid analysis',
                    'Accurate rule-based sentiment scoring',
                    'Searchable text storage for easy information retrieval',
                    'Automated alerts and group reports for improved workflow',
                  ].map((outcome, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="flex-shrink-0 h-6 w-6 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="ml-3 text-gray-600">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Timeline */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-extrabold text-gray-900">Project Milestones</h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">
            Our development journey in phases
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gray-200" />

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
                <div className="absolute left-1/2 transform -translate-x-1/2 md:left-1/2 md:transform md:-translate-x-1/2 flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-full z-10">
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>

                {/* Content */}
                <div className={`md:w-1/2 ${
                  index % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16'
                }`}>
                  <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                        {milestone.date}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-extrabold text-gray-900">Technology Stack</h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">
              Modern tools for a modern solution
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { name: 'React', description: 'Frontend Framework', color: 'bg-blue-100 text-blue-800' },
              { name: 'TypeScript', description: 'Type Safety', color: 'bg-blue-100 text-blue-800' },
              { name: 'Node.js', description: 'Backend Runtime', color: 'bg-green-100 text-green-800' },
              { name: 'Python', description: 'Processing Engine', color: 'bg-yellow-100 text-yellow-800' },
              { name: 'MongoDB', description: 'Database', color: 'bg-green-100 text-green-800' },
              { name: 'Docker', description: 'Containerization', color: 'bg-blue-100 text-blue-800' },
            ].map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-300"
              >
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${tech.color} mb-4`}>
                  {tech.name}
                </div>
                <div className="text-sm text-gray-600">{tech.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact/Footer */}
      <div className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-4">Python Parallel Text Handling Processor</h3>
            <p className="text-base text-gray-400 mb-6">
              A project by passionate developers dedicated to making text processing efficient and accessible.
            </p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
            <p className="mt-8 text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Python Parallel Text Processor Team. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;