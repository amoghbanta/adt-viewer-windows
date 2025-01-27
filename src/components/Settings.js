import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from "react-native";
import * as RNFS from "@dr.pogodin/react-native-fs";
import { unzipFile, saveCourse, getBaseDirectory, sanitizePath } from "../utils/courseUtils";

const Settings = ({ navigation }) => {
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  const handleDownloadCourse = useCallback(async () => {
    if (!urlInput) {
      Alert.alert("Error", "Please enter a URL");
      return;
    }

    try {
      setLoading(true);
      setStatus("Initializing download...");
      setProgress(0);

      const baseDir = await getBaseDirectory();
      const zipFile = sanitizePath(`${baseDir}/course_${Date.now()}.zip`);
      console.log("Base directory path:", baseDir);
      console.log("Sanitized zip file path:", zipFile);


      const download = RNFS.downloadFile({
        fromUrl: urlInput,
        toFile: zipFile,
        progress: (res) => {
          const percent = (res.bytesWritten / res.contentLength) * 100;
          setProgress(percent);
          setStatus(`Downloading: ${Math.round(percent)}%`);
        },
        background: true,
        discretionary: true,
        cacheable: false,
      });

      const response = await download.promise;

      if (response.statusCode === 200) {
        setStatus("Extracting files...");
        const extractedDir = await unzipFile(zipFile);

        setStatus("Saving course...");
        const courseName = urlInput.split("/").pop().split("?")[0];
        await saveCourse({
          name: courseName || "Downloaded Course",
          path: extractedDir,
          dateAdded: new Date().toISOString(),
        });

        await RNFS.unlink(zipFile);
        Alert.alert("Success", "Course downloaded successfully");
        navigation.navigate("MyCourses");
      } else {
        throw new Error(`Download failed with status ${response.statusCode}`);
      }
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
      setProgress(0);
      setStatus("");
      setUrlInput("");
    }
  }, [urlInput, navigation]);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Download Course</Text>

        <TextInput
          style={styles.input}
          value={urlInput}
          onChangeText={setUrlInput}
          placeholder="Enter course URL"
          editable={!loading}
          multiline={true}
          numberOfLines={2}
        />

        {loading && (
          <>
            <Text style={styles.status}>{status}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progress, { width: `${progress}%` }]} />
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleDownloadCourse}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Downloading..." : "Download Course"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
    minHeight: 80,
    textAlignVertical: "top",
  },
  status: {
    textAlign: "center",
    marginBottom: 10,
    color: "#666",
  },
  progressBar: {
    height: 10,
    backgroundColor: "#eee",
    borderRadius: 5,
    marginBottom: 20,
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    backgroundColor: "#4CAF50",
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#B0BEC5",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default Settings;