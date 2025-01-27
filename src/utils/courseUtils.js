import * as RNFS from "@dr.pogodin/react-native-fs";
import StaticServer from '@dr.pogodin/react-native-static-server';
import JSZip from "jszip";
import { Platform } from "react-native";
import { Buffer } from "buffer";

global.Buffer = global.Buffer || Buffer;

let server = null;

export const sanitizePath = (path) => {
  return Platform.OS === "windows" ? path.replace(/\//g, "\\") : path;
};

export const getBaseDirectory = async () => {
  const baseDir = Platform.OS === "windows"
    ? `${RNFS.DocumentDirectoryPath}\\Courses`
    : `${RNFS.DocumentDirectoryPath}/Courses`;

  const sanitizedBaseDir = sanitizePath(baseDir);


  if (!(await RNFS.exists(sanitizedBaseDir))) {
    await RNFS.mkdir(sanitizedBaseDir);
  }
  return sanitizedBaseDir;
};

export const startServer = async (path) => {
  try {
    console.log("Starting server with path:", path);
    if (server) {
      await server.stop();
    }
    const normalizedPath = Platform.OS === "windows" ? path.replace(/\\/g, "/") : path;
    console.log("Normalized path:", normalizedPath);

    server = new StaticServer(8080, {
      fileDir: normalizedPath,
      localOnly: true,
      keepAlive: true,
    });

    await server.start();
    const serverOrigin = server.origin;
    console.log("Server started at:", serverOrigin);
    return serverOrigin;
  } catch (error) {
    console.error("Server start error:", error);
    throw new Error(`Failed to start server: ${error.message}`);
  }
};


export const startServerWindows = async (path) => {
  try {
    if (server) {
      await server.stop();
    }
    // Assign to module-level server variable
    server = new StaticServer({
      fileDir: path,
      port: 3005,
      localOnly:true,
      keepAlive:true
    });

    const url = await server.start();
    console.log('Server running at:', url);
    return url; // Return the base URL without appending index.html
  } catch (error) {
    console.error('Server setup failed:', error);
    throw error;
  }
};
export const stopServer = async () => {
  try {
    if (server) {
      await server.stop();
      server = null;
    }
  } catch (error) {
    console.error("Error stopping server:", error);
  }
};

export const loadCourses = async () => {
  try {
    const baseDir = await getBaseDirectory();
    const filePath = sanitizePath(`${baseDir}/courses.json`);

    if (await RNFS.exists(filePath)) {
      const coursesData = await RNFS.readFile(filePath, "utf8");
      return JSON.parse(coursesData);
    }
    return [];
  } catch (error) {
    console.error("Failed to load courses:", error);
    throw new Error(`Failed to load courses: ${error.message}`);
  }
};

const arrayBufferToBase64 = (buffer) => {
  return Buffer.from(buffer).toString("base64");
};

export const unzipFile = async (zipFilePath) => {
  try {
    const baseDir = await getBaseDirectory();
    const timestamp = Date.now();
    const outputDir = sanitizePath(`${baseDir}/course_${timestamp}`);

    await RNFS.mkdir(outputDir);

    const zipData = await RNFS.readFile(zipFilePath, "base64");
    const jszip = new JSZip();
    const zip = await jszip.loadAsync(zipData, { base64: true });

    for (const fileName of Object.keys(zip.files)) {
      const file = zip.files[fileName];
      console.log("Extracting file:", fileName);
      if (!file.dir) {
        const fileContent = await file.async("uint8array");
        const filePath = sanitizePath(`${outputDir}/${fileName}`);
        const dirPath = filePath.substring(
          0,
          filePath.lastIndexOf(Platform.OS === "windows" ? "\\" : "/")
        );

        if (!(await RNFS.exists(dirPath))) {
          await RNFS.mkdir(dirPath);
        }

        await RNFS.writeFile(
          filePath,
          arrayBufferToBase64(fileContent),
          "base64"
        );
      }
    }

    return outputDir;
  } catch (error) {
    console.error("Error unzipping file:", error);
    throw new Error(`Failed to unzip file: ${error.message}`);
  }
};

export const saveCourse = async (course) => {
  try {
    const baseDir = await getBaseDirectory();
    const filePath = sanitizePath(`${baseDir}/courses.json`);

    let courses = await loadCourses();
    courses = courses.filter((c) => c.path !== course.path);
    courses.push(course);

    await RNFS.writeFile(filePath, JSON.stringify(courses), "utf8");
    return courses;
  } catch (error) {
    console.error("Failed to save course:", error);
    throw new Error(`Failed to save course: ${error.message}`);
  }
};

export const deleteCourse = async (coursePath) => {
  try {
    if (await RNFS.exists(coursePath)) {
      await RNFS.unlink(coursePath);
    }

    const courses = await loadCourses();
    const updatedCourses = courses.filter((c) => c.path !== coursePath);

    const baseDir = await getBaseDirectory();
    const filePath = sanitizePath(`${baseDir}/courses.json`);
    await RNFS.writeFile(filePath, JSON.stringify(updatedCourses), "utf8");

    return updatedCourses;
  } catch (error) {
    console.error("Failed to delete course:", error);
    throw new Error(`Failed to delete course: ${error.message}`);
  }
};