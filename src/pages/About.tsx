import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sprout, Droplets, MapPin, BarChart3, Wifi, Database } from "lucide-react";

const About = () => {
  const features = [
    {
      icon: Droplets,
      title: "Smart Irrigation",
      description: "Automated moisture monitoring and irrigation management to optimize water usage and crop health."
    },
    {
      icon: MapPin,
      title: "Livestock Tracking",
      description: "Real-time GPS tracking of cattle with health monitoring and geofencing capabilities."
    },
    {
      icon: BarChart3,
      title: "Data Analytics",
      description: "Comprehensive analytics dashboard providing insights into farm operations and trends."
    },
    {
      icon: Wifi,
      title: "IoT Sensors",
      description: "Network of wireless sensors continuously collecting environmental and operational data."
    },
    {
      icon: Database,
      title: "Cloud Storage",
      description: "Secure cloud-based data storage with historical tracking and reporting capabilities."
    },
    {
      icon: Sprout,
      title: "Crop Management",
      description: "Integrated systems for monitoring crop conditions and optimizing agricultural practices."
    }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-farm-dark-green to-farm-medium-green text-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl font-bold flex items-center gap-3">
            <Sprout className="w-8 h-8" />
            About NCAIR Smart Farm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed">
            NCAIR Smart Farm is an advanced agricultural monitoring and management system designed to modernize 
            farming operations through technology. Our platform integrates IoT sensors, GPS tracking, and 
            data analytics to provide farmers with real-time insights and automated solutions for optimizing 
            their operations.
          </p>
        </CardContent>
      </Card>

      {/* Mission Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-farm-dark-green">Our Mission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            We aim to empower farmers with cutting-edge technology that makes farm management more efficient, 
            sustainable, and profitable. By bridging the gap between traditional farming practices and modern 
            technology, we help create smarter, more responsive agricultural systems.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Our integrated approach combines environmental monitoring, livestock management, and predictive 
            analytics to give farmers complete visibility and control over their operations from any device, 
            anywhere.
          </p>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div>
        <h2 className="text-2xl font-bold text-farm-dark-green mb-4">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 bg-farm-light-green rounded-full flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-farm-dark-green" />
                  </div>
                  <h3 className="font-semibold text-lg text-farm-dark-green">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-farm-dark-green">Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-farm-dark-green rounded-full mt-2 flex-shrink-0" />
              <p className="text-gray-700">
                <strong>Increased Efficiency:</strong> Automate routine monitoring tasks and receive instant 
                alerts for issues requiring attention.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-farm-dark-green rounded-full mt-2 flex-shrink-0" />
              <p className="text-gray-700">
                <strong>Resource Optimization:</strong> Reduce water waste and optimize resource allocation 
                through data-driven decision making.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-farm-dark-green rounded-full mt-2 flex-shrink-0" />
              <p className="text-gray-700">
                <strong>Better Animal Welfare:</strong> Monitor livestock health and location in real-time 
                to ensure optimal care.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-farm-dark-green rounded-full mt-2 flex-shrink-0" />
              <p className="text-gray-700">
                <strong>Data-Driven Insights:</strong> Make informed decisions based on historical trends 
                and predictive analytics.
              </p>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default About;
