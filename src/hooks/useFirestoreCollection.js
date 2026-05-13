import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/config";

export default function useFirestoreCollection(collectionName, filters = [], options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);
  const enabled = options.enabled !== false;

  useEffect(() => {
    if (!enabled) {
      setData([]);
      setError(null);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const parsedFilters = JSON.parse(filterKey);
    const constraints = parsedFilters
      .filter((filter) => filter.value !== undefined && filter.value !== null && filter.value !== "")
      .map((filter) => where(filter.field, filter.operator || "==", filter.value));

    const ref = constraints.length
      ? query(collection(db, collectionName), ...constraints)
      : collection(db, collectionName);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [collectionName, enabled, filterKey]);

  return { data, loading, error };
}
