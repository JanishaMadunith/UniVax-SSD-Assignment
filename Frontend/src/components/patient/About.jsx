import React from 'react';
import { 
  Shield, 
  Target, 
  Users, 
  Award, 
  Heart, 
  Syringe,
  Clock,
  Globe,
  CheckCircle,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Instagram
} from 'lucide-react';
import TopNavbar from './TopNavbar';
import { Link } from 'react-router-dom';

const About = () => {
  const stats = [
    { icon: Users, value: '50,000+', label: 'Vaccinations Done', color: 'from-blue-500 to-cyan-500' },
    { icon: Shield, value: '98%', label: 'Satisfaction Rate', color: 'from-green-500 to-teal-500' },
    { icon: Award, value: '25+', label: 'Partner Clinics', color: 'from-purple-500 to-pink-500' },
    { icon: Clock, value: '24/7', label: 'Support Available', color: 'from-orange-500 to-red-500' }
  ];

  const features = [
    {
      icon: Syringe,
      title: 'Safe Vaccinations',
      description: 'WHO-approved vaccines stored and administered under strict medical protocols.',
      color: 'text-blue-600'
    },
    {
      icon: Target,
      title: 'Easy Scheduling',
      description: 'Book appointments online with real-time availability and reminders.',
      color: 'text-green-600'
    },
    {
      icon: Heart,
      title: 'Personalized Care',
      description: 'Tailored vaccination plans based on your age, health, and medical history.',
      color: 'text-rose-600'
    },
    {
      icon: Globe,
      title: 'Nationwide Network',
      description: 'Access to vaccination centers across all major cities in Sri Lanka.',
      color: 'text-purple-600'
    }
  ];

  const teamMembers = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Chief Medical Officer',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop',
      bio: '15+ years in public health and immunization programs'
    },
    {
      name: 'Dr. Michael Chen',
      role: 'Head of Operations',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop',
      bio: 'Expert in healthcare logistics and vaccine distribution'
    },
    {
      name: 'Dr. Amila Perera',
      role: 'Lead Epidemiologist',
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop',
      bio: 'Specializing in infectious disease prevention'
    }
  ];

  const milestones = [
    { year: '2020', title: 'Platform Launched', description: 'Started with 5 pilot vaccination centers' },
    { year: '2021', title: 'Nationwide Expansion', description: 'Expanded to 20+ locations across Sri Lanka' },
    { year: '2022', title: 'Digital Health Records', description: 'Launched secure digital vaccination records' },
    { year: '2024', title: 'Mobile App Launch', description: 'Reached 50,000+ successful vaccinations' }
  ];

  return (
    <>
      <TopNavbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
        
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full -ml-48 -mb-48"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <Shield className="w-16 h-16 mx-auto mb-6 text-white/90" />
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Your Trusted Partner in
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                Vaccination Care
              </span>
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              We're on a mission to make vaccination accessible, convenient, and reliable for every citizen.
              Join thousands of satisfied patients who trust us for their immunization needs.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-2xl transition-all transform hover:-translate-y-1"
                >
                  <div className={`inline-flex p-3 rounded-full bg-gradient-to-r ${stat.color} text-white mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</h3>
                  <p className="text-gray-600">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-8 h-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-800">Our Mission</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                To provide accessible, affordable, and high-quality vaccination services to every individual,
                ensuring community health and preventing vaccine-preventable diseases through education,
                innovation, and compassionate care.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-8 h-8 text-rose-600" />
                <h2 className="text-2xl font-bold text-gray-800">Our Vision</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                A healthier Sri Lanka where every citizen has easy access to life-saving vaccines,
                leading to the elimination of vaccine-preventable diseases and improved public health outcomes.
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Why Choose Us?
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              We combine medical expertise with modern technology to provide the best vaccination experience
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-2xl transition-all group"
                >
                  <div className={`${feature.color} mb-4 flex justify-center`}>
                    <Icon className="w-12 h-12 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Journey Timeline */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Our Journey
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Milestones that shaped our commitment to public health
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-400 to-cyan-400 hidden md:block"></div>
            <div className="space-y-8 md:space-y-0">
              {milestones.map((milestone, idx) => (
                <div key={idx} className={`relative flex flex-col md:flex-row ${idx % 2 === 0 ? 'md:justify-start' : 'md:justify-end'} items-center`}>
                  <div className={`md:w-1/2 ${idx % 2 === 0 ? 'md:pr-12' : 'md:pl-12'}`}>
                    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                          {milestone.year.slice(2)}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">{milestone.title}</h3>
                      </div>
                      <p className="text-gray-600">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Meet Our Leadership
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Dedicated professionals committed to your health and safety
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all group">
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{member.name}</h3>
                  <p className="text-blue-600 font-medium mb-2">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-8 md:p-12 text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Our Core Values
                </h2>
                <p className="text-blue-100 mb-6">
                  These principles guide everything we do at VaccineCare
                </p>
                <div className="space-y-3">
                  {['Patient First', 'Medical Excellence', 'Transparency', 'Innovation', 'Community Health'].map((value, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-yellow-300" />
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <Shield className="w-16 h-16 mx-auto mb-4 text-yellow-300" />
                <p className="text-center text-lg italic">
                  "We believe that every individual deserves access to safe and effective vaccination,
                  regardless of their background or circumstances."
                </p>
                <p className="text-center text-blue-200 mt-4 font-semibold">
                  - Dr. Sarah Johnson, Chief Medical Officer
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & CTA Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Ready to Get Vaccinated?
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Join thousands of satisfied patients who have chosen us for their vaccination needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Get in Touch</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-800">+94 112 345 678</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-800">info@vaccinecare.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium text-gray-800">Colombo, Sri Lanka</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-gray-600 mb-3">Follow us on social media</p>
                <div className="flex gap-3">
                  <button className="p-2 bg-gray-100 rounded-full hover:bg-blue-100 transition">
                    <Facebook className="w-5 h-5 text-blue-600" />
                  </button>
                  <button className="p-2 bg-gray-100 rounded-full hover:bg-blue-100 transition">
                    <Twitter className="w-5 h-5 text-blue-600" />
                  </button>
                  <button className="p-2 bg-gray-100 rounded-full hover:bg-blue-100 transition">
                    <Linkedin className="w-5 h-5 text-blue-600" />
                  </button>
                  <button className="p-2 bg-gray-100 rounded-full hover:bg-blue-100 transition">
                    <Instagram className="w-5 h-5 text-blue-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-8 flex flex-col justify-center items-center text-center">
              <Syringe className="w-16 h-16 text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Start Your Vaccination Journey</h3>
              <p className="text-gray-600 mb-6">Book your appointment today and take the first step towards better health</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/patient/clinics"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center gap-2"
                >
                  Book Appointment <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/patient/clinics"
                  className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-semibold"
                >
                  Find a Clinic
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;