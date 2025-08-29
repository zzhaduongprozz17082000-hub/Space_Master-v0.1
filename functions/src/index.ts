import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {QueryDocumentSnapshot} from "firebase-admin/firestore";

admin.initializeApp();

// FIX: Updated function signature for onCall handler to use a single request object.
// FIX: Replaced 'exports' with 'export const' to use ES module syntax and resolve 'Cannot find name' error.
export const getAdminStats = functions.https.onCall(
    async (request) => {
      // First, ensure the user is authenticated.
      if (!request.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "The function must be called while authenticated.",
        );
      }

      // Next, check if the user has an 'admin' role in Firestore.
      const userDoc = await admin
          .firestore()
          .collection("users")
          .doc(request.auth.uid)
          .get();
      if (userDoc.data()?.role !== "admin") {
        throw new functions.https.HttpsError(
            "permission-denied",
            "You must be an admin to call this function.",
        );
      }

      // If the checks pass, perform the aggregations using the Admin SDK.
      try {
        const db = admin.firestore();
        const usersPromise = db.collection("users").get();
        const filesPromise = db.collection("files").get();
        const foldersPromise = db.collection("folders").get();

        const [usersSnap, filesSnap, foldersSnap] = await Promise.all([
          usersPromise,
          filesPromise,
          foldersPromise,
        ]);

        const totalStorage = filesSnap.docs.reduce(
            (sum: number, doc: QueryDocumentSnapshot) =>
              sum + (doc.data().size || 0),
            0,
        );

        // Return the aggregated data to the client.
        return {
          userCount: usersSnap.size,
          fileCount: filesSnap.size,
          folderCount: foldersSnap.size,
          totalStorage,
        };
      } catch (error) {
        console.error("Error aggregating stats:", error);
        // Throw an error that the client can catch.
        throw new functions.https.HttpsError(
            "internal",
            "An error occurred while fetching statistics.",
        );
      }
    },
);

// FIX: Updated function signature for onCall handler to use a single request object.
// FIX: Replaced 'exports' with 'export const' to use ES module syntax and resolve 'Cannot find name' error.
export const updateUserRole = functions.https.onCall(
    async (request) => {
        const data = request.data as { uid: string; role: "admin" | "user" };
    // 1. Check if the user is authenticated.
      if (!request.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "The function must be called while authenticated.",
        );
      }

      // 2. Check if the authenticated user is an admin.
      const callerDoc = await admin
          .firestore()
          .collection("users")
          .doc(request.auth.uid)
          .get();
      if (callerDoc.data()?.role !== "admin") {
        throw new functions.https.HttpsError(
            "permission-denied",
            "You must be an admin to perform this action.",
        );
      }

      // 3. Validate the input data.
      if (!data.uid || !data.role ||
        (data.role !== "admin" && data.role !== "user")) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "The function must be called with a valid 'uid' and 'role'.",
        );
      }

      // 4. Perform the role update.
      try {
        await admin.firestore().collection("users").doc(data.uid).update({
          role: data.role,
        });
        return {
          success: true,
          message: `Role for user ${data.uid} updated to ${data.role}.`,
        };
      } catch (error) {
        console.error("Error updating user role:", error);
        throw new functions.https.HttpsError(
            "internal",
            "An error occurred while updating the user role.",
        );
      }
    },
);

export const deleteUser = functions.https.onCall(
    async (request) => {
        const data = request.data as { uid: string };
        // 1. Check if the user is authenticated.
        if (!request.auth) {
            throw new functions.https.HttpsError(
                "unauthenticated",
                "The function must be called while authenticated.",
            );
        }

        // 2. Check if the authenticated user is an admin.
        const callerDoc = await admin
            .firestore()
            .collection("users")
            .doc(request.auth.uid)
            .get();
        if (callerDoc.data()?.role !== "admin") {
            throw new functions.https.HttpsError(
                "permission-denied",
                "You must be an admin to perform this action.",
            );
        }

        // 3. Validate the input data.
        if (!data.uid) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "The function must be called with a valid 'uid'.",
            );
        }

        const uidToDelete = data.uid;

        try {
            const db = admin.firestore();
            const bucket = admin.storage().bucket();
            const batch = db.batch();

            // Find and delete all files and folders owned by the user from Firestore & Storage
            const filesQuery = db.collection("files").where("ownerId", "==", uidToDelete);
            const filesSnap = await filesQuery.get();
            const storageDeletePromises: Promise<any>[] = [];

            filesSnap.forEach((doc) => {
                const fileData = doc.data();
                if (fileData.storagePath) {
                    storageDeletePromises.push(bucket.file(fileData.storagePath).delete());
                }
                batch.delete(doc.ref);
            });

            const foldersQuery = db.collection("folders").where("ownerId", "==", uidToDelete);
            const foldersSnap = await foldersQuery.get();
            foldersSnap.forEach((doc) => {
                batch.delete(doc.ref);
            });
            
            // Delete the user's document from the 'users' collection
            const userRef = db.collection("users").doc(uidToDelete);
            batch.delete(userRef);
            
            // Commit Firestore deletions
            await batch.commit();

            // Await storage deletions
            await Promise.all(storageDeletePromises);

            // Finally, delete the user from Firebase Authentication
            await admin.auth().deleteUser(uidToDelete);

            return { success: true, message: `Successfully deleted user ${uidToDelete} and all their data.` };
        } catch (error) {
            console.error(`Error deleting user ${uidToDelete}:`, error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            throw new functions.https.HttpsError("internal", `An error occurred while deleting the user: ${errorMessage}`);
        }
    },
);