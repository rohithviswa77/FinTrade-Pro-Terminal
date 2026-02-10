import { db } from "./config";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, orderBy, limit, getDocs } from "firebase/firestore";

// Save or Update Overall Accuracy
export const saveAccuracy = async (userId, wins, total) => {
  const docRef = doc(db, "terminal_stats", userId);
  await setDoc(docRef, { wins, total }, { merge: true });
};

// Log a specific trade pattern and its result
export const logTrade = async (userId, tradeData) => {
  const logRef = collection(db, "users", userId, "trade_logs");
  await addDoc(logRef, {
    ...tradeData,
    timestamp: Date.now()
  });
};

// Fetch last 5 trades for the Performance Log
export const fetchRecentLogs = async (userId) => {
  const logRef = collection(db, "users", userId, "trade_logs");
  const q = query(logRef, orderBy("timestamp", "desc"), limit(5));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};