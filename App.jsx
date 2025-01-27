import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";

import MyCourses from "./src/components/MyCourses";
import Settings from "./src/components/Settings";

const Tab = createBottomTabNavigator();

const App = () => {

  console.log("Platform.OS is", Platform.OS);
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === "My Courses") iconName = "library-books";
            else if (route.name === "Settings") iconName = "settings";

            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#007BFF",
          tabBarInactiveTintColor: "gray",
        })}
      >
        <Tab.Screen name="My Courses" component={MyCourses} />
        <Tab.Screen name="Settings" component={Settings} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App;