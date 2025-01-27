import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import * as RNFS from "@dr.pogodin/react-native-fs";
import { loadCourses, deleteCourse, startServer,startServerWindows, stopServer } from "../utils/courseUtils";


const serverInstance= Platform.OS==="windows"?startServerWindows:startServer;

const CourseItem = ({ course, onView, onDelete }) => (
  <View style={styles.courseItem}>
    <View style={styles.courseInfo}>
      <Text style={styles.courseName}>{course.name}</Text>
      <Text style={styles.courseDate}>
        Added: {new Date(course.dateAdded).toLocaleDateString()}
      </Text>
    </View>
    <View style={styles.courseActions}>
      <TouchableOpacity onPress={onView} style={styles.viewButton}>
        <Text style={styles.viewButtonText}>View</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [serverUrl, setServerUrl] = useState(null);
  const [error, setError] = useState(null);

  const loadCourseData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const savedCourses = await loadCourses();
      setCourses(savedCourses);
    } catch (err) {
      setError(err.message);
      Alert.alert("Error", "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  const handleViewCourse = useCallback(async (course) => {
    try {
      if (!course.path) {
        throw new Error("Course path is missing");
      }
      console.log('course is', course)
      
      const exists = await RNFS.exists(course.path);
      console.log('Course path exists:', exists, course.path);
      
      if (!exists) {
        throw new Error("Course files not found");
      }
      
      let url = await startServerWindows(course.path);
      const entryPoint= "index.html";
      url =`${url}/${entryPoint}`
      console.log('Server URL:', url);
      setServerUrl(url);
      setSelectedCourse(course);
    } catch (err) {
      console.error('View course error:', err);
      Alert.alert("Error", err.message);
    }
  }, []);

  const handleDeleteCourse = useCallback(async (course) => {
    Alert.alert(
      "Delete Course",
      `Are you sure you want to delete "${course.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedCourses = await deleteCourse(course.path);
              setCourses(updatedCourses);
            } catch (err) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ]
    );
  }, []);

  const handleCloseCourse = useCallback(async () => {
    await stopServer();
    setServerUrl(null);
    setSelectedCourse(null);
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadCourseData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (selectedCourse && serverUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleCloseCourse}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedCourse.name}</Text>
        </View>
        <WebView
          source={{ uri: serverUrl }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>My Courses</Text>
      {courses.length === 0 ? (
        <View style={styles.emptyCourses}>
          <Text style={styles.emptyText}>No courses downloaded yet</Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.path}
          renderItem={({ item }) => (
            <CourseItem
              course={item}
              onView={() => handleViewCourse(item)}
              onDelete={() => handleDeleteCourse(item)}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    margin: 20,
  },
  courseItem: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  courseDate: {
    fontSize: 14,
    color: "#666",
  },
  courseActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  viewButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
    marginRight: 10,
  },
  viewButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#f44336",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyCourses: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    color: "#f44336",
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "white",
    elevation: 2,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: "#2196F3",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  webview: {
    flex: 1,
  },
  list: {
    paddingBottom: 20,
  },
});

export default MyCourses;