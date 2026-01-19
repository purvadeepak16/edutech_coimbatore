import { db } from "../config/firebase.js";
import admin from "../config/firebase.js";
import auth from "../middleware/auth.js";

// NOTE: controller functions assume `req.user` is set by auth middleware

async function areUsersConnected(userA, userB) {
  try {
    const q1 = await db.collection("connections").where("studentId", "==", userA).where("teacherId", "==", userB).where("status", "==", "accepted").get();
    if (!q1.empty) return true;
    const q2 = await db.collection("connections").where("studentId", "==", userB).where("teacherId", "==", userA).where("status", "==", "accepted").get();
    if (!q2.empty) return true;
    return false;
  } catch (err) {
    console.warn("Connection check failed:", err.message || err);
    return false;
  }
}

export const createStudyGroup = async (req, res) => {
  try {
    const { name, subject, description, visibility = "public", tags = [], nextMeeting } = req.body;
    const organizerId = req.user?.id;

    if (!organizerId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!name) return res.status(400).json({ success: false, message: "Name is required" });

    const data = {
      name,
      subject: subject || "",
      description: description || "",
      visibility: visibility === "private" ? "private" : "public",
      organizerId,
      tags: Array.isArray(tags) ? tags : [],
      nextMeeting: nextMeeting || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ref = await db.collection("studyGroups").add(data);

    // Add organizer as member
    await db.collection("studyGroups").doc(ref.id).collection("members").doc(organizerId).set({
      userId: organizerId,
      role: "organizer",
      joinedAt: new Date().toISOString(),
    });

    // Also add organizer to parent document members array for frontend convenience
    try {
      await db.collection("studyGroups").doc(ref.id).update({
        members: admin.firestore.FieldValue.arrayUnion({ userId: organizerId, role: "organizer" }),
      });
    } catch (arrErr) {
      // If update fails (shouldn't), log and continue
      console.warn("Failed to update parent members array on create:", arrErr.message || arrErr);
    }

    res.status(201).json({ success: true, id: ref.id, group: { id: ref.id, ...data } });
  } catch (err) {
    console.error("Create study group error:", err);
    res.status(500).json({ success: false, message: "Failed to create group", error: err.message });
  }
};

export const listStudyGroups = async (req, res) => {
  try {
    const userId = req.user?.id;
    console.log("listStudyGroups called, userId=", userId);
    const groups = [];

    // Public groups
    let publicSnap;
    try {
      publicSnap = await db.collection("studyGroups").where("visibility", "==", "public").orderBy("createdAt", "desc").limit(50).get();
      console.log("public groups snapshot size:", publicSnap.size);
      publicSnap.forEach((doc) => groups.push({ id: doc.id, ...doc.data() }));
    } catch (qerr) {
      // If ordering by createdAt fails (indexes), fall back to an unsorted query.
      console.warn("Public groups query failed (trying unsorted fallback):", qerr.message || qerr);
      publicSnap = await db.collection("studyGroups").where("visibility", "==", "public").limit(50).get();
      console.log("public groups fallback snapshot size:", publicSnap.size);
      publicSnap.forEach((doc) => groups.push({ id: doc.id, ...doc.data() }));
    }

    // Include private groups where user is member
    if (userId) {
      try {
        const memberGroupsSnap = await db.collectionGroup("members").where("userId", "==", userId).get();
        console.log("memberGroupsSnap size:", memberGroupsSnap.size);
        for (const doc of memberGroupsSnap.docs) {
          try {
            const groupRef = doc.ref.parent.parent; // members doc -> members collection -> studyGroups doc
            if (!groupRef) {
              console.warn("member doc has no group parent:", doc.ref.path);
              continue;
            }
            const gdoc = await groupRef.get();
            if (gdoc.exists) {
              const data = { id: groupRef.id, ...gdoc.data() };
              if (!groups.find((g) => g.id === data.id)) groups.push(data);
            }
          } catch (innerErr) {
            console.warn("Error resolving member group for doc", doc.id, innerErr.message || innerErr);
          }
        }
      } catch (memberErr) {
        // If collectionGroup query fails (indexes / permissions), warn and continue with public groups only
        console.warn("Member groups fetch failed, skipping private groups:", memberErr.message || memberErr);
      }
    }

    res.json({ success: true, groups, total: groups.length });
  } catch (err) {
    console.error("List study groups error:", err);
    res.status(500).json({ success: false, message: "Failed to list groups", error: err.message });
  }
};

export const getStudyGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!id) return res.status(400).json({ success: false, message: "Group id required" });

    const doc = await db.collection("studyGroups").doc(id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: "Group not found" });

    const data = doc.data();
    // determine membership (organizer counts as member)
    let isMember = false;
    if (userId) {
      try {
        const isMemberSnap = await db.collection("studyGroups").doc(id).collection("members").doc(userId).get();
        isMember = isMemberSnap.exists || userId === data.organizerId;
      } catch (e) {
        console.warn("Membership check failed:", e.message || e);
        isMember = userId === data.organizerId;
      }
    }

    // only return members list to members/organizer
    let members = [];
    if (isMember) {
      const membersSnap = await db.collection("studyGroups").doc(id).collection("members").limit(100).get();
      members = membersSnap.docs.map((d) => d.data());
    }

    res.json({ success: true, group: { id: doc.id, ...data }, isMember, members });
  } catch (err) {
    console.error("Get study group error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch group", error: err.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { text } = req.body;
    if (!id || !userId) return res.status(400).json({ success: false, message: 'Missing params or unauthorized' });
    if (!text || typeof text !== 'string') return res.status(400).json({ success: false, message: 'Message text required' });

    const groupRef = db.collection('studyGroups').doc(id);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) return res.status(404).json({ success: false, message: 'Group not found' });
    const group = groupDoc.data();

    // verify membership
    const memberRef = groupRef.collection('members').doc(userId);
    const memberDoc = await memberRef.get();
    const isMember = memberDoc.exists || userId === group.organizerId;
    if (!isMember) return res.status(403).json({ success: false, message: 'Only group members can send messages' });

    // Save message with server timestamp
    const msgRef = await groupRef.collection('messages').add({
      text,
      senderId: userId,
      senderName: req.user?.displayName || req.user?.email || userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true, id: msgRef.id });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ success: false, message: 'Failed to send message', error: err.message });
  }
};

export const joinStudyGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!id || !userId) return res.status(400).json({ success: false, message: "Missing group id or unauthorized" });

    const groupRef = db.collection("studyGroups").doc(id);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) return res.status(404).json({ success: false, message: "Group not found" });
    const data = groupDoc.data();

    const memberRef = groupRef.collection("members").doc(userId);
    const memberDoc = await memberRef.get();

    // If already a member in subcollection, make sure parent doc array also contains the member and return success (idempotent)
    if (memberDoc.exists) {
      try {
        await groupRef.update({ members: admin.firestore.FieldValue.arrayUnion({ userId, role: "member" }) });
      } catch (uErr) {
        console.warn("Failed to ensure parent members array contains existing member:", uErr.message || uErr);
      }
      return res.json({ success: true, message: "Already a member" });
    }

    if (data.visibility === "public") {
      await memberRef.set({ userId, role: "member", joinedAt: new Date().toISOString() });
      // also add to parent members array for quick reads by frontend
      try {
        await groupRef.update({ members: admin.firestore.FieldValue.arrayUnion({ userId, role: "member" }) });
      } catch (uErr) {
        console.warn("Failed to update parent members array on join:", uErr.message || uErr);
      }
      return res.json({ success: true, message: "Joined group" });
    }

    // private: require connection to organizer
    const organizerId = data.organizerId;
    const connected = await areUsersConnected(userId, organizerId);
    if (!connected) {
      return res.status(403).json({ success: false, message: "You can only request to join private groups if connected to the organizer" });
    }

    const reqRef = await groupRef.collection("requests").add({ userId, status: "pending", createdAt: new Date().toISOString() });
    res.json({ success: true, message: "Request submitted", requestId: reqRef.id });
  } catch (err) {
    console.error("Join study group error:", err);
    res.status(500).json({ success: false, message: "Failed to join group", error: err.message });
  }
};

export const approveRequest = async (req, res) => {
  try {
    const { id, requestId } = req.params;
    const userId = req.user?.id;
    if (!id || !requestId) return res.status(400).json({ success: false, message: "Missing params" });

    const groupRef = db.collection("studyGroups").doc(id);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) return res.status(404).json({ success: false, message: "Group not found" });
    const group = groupDoc.data();
    if (group.organizerId !== userId) return res.status(403).json({ success: false, message: "Only organizer can approve" });

    const reqRef = groupRef.collection("requests").doc(requestId);
    const reqDoc = await reqRef.get();
    if (!reqDoc.exists) return res.status(404).json({ success: false, message: "Request not found" });
    const reqData = reqDoc.data();

    await groupRef.collection("members").doc(reqData.userId).set({ userId: reqData.userId, role: "member", joinedAt: new Date().toISOString() });
    // also add to parent members array
    try {
      await groupRef.update({ members: admin.firestore.FieldValue.arrayUnion({ userId: reqData.userId, role: "member" }) });
    } catch (uErr) {
      console.warn("Failed to update parent members array on approve:", uErr.message || uErr);
    }
    await reqRef.update({ status: "approved", updatedAt: new Date().toISOString() });

    res.json({ success: true, message: "Request approved" });
  } catch (err) {
    console.error("Approve request error:", err);
    res.status(500).json({ success: false, message: "Failed to approve request", error: err.message });
  }
};

export const leaveStudyGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!id || !userId) return res.status(400).json({ success: false, message: "Missing params" });

    const memberRef = db.collection("studyGroups").doc(id).collection("members").doc(userId);
    // Delete subcollection doc if exists (idempotent)
    try {
      await memberRef.delete();
    } catch (delErr) {
      console.warn("Failed to delete member subcollection doc (may not exist):", delErr.message || delErr);
    }

    // Remove from parent members array (best-effort)
    try {
      await db.collection("studyGroups").doc(id).update({ members: admin.firestore.FieldValue.arrayRemove({ userId, role: "member" }) });
    } catch (uErr) {
      console.warn("Failed to remove member from parent members array:", uErr.message || uErr);
    }

    res.json({ success: true, message: "Left group" });
  } catch (err) {
    console.error("Leave study group error:", err);
    res.status(500).json({ success: false, message: "Failed to leave group", error: err.message });
  }
};

// Helper: delete all documents in a collection reference in batches
async function deleteCollection(collectionRef) {
  const batchSize = 200;
  while (true) {
    const snapshot = await collectionRef.limit(batchSize).get();
    if (snapshot.empty) return;
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    // continue until empty
  }
}

export const deleteStudyGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!id) return res.status(400).json({ success: false, message: "Group id required" });
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const groupRef = db.collection('studyGroups').doc(id);
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) return res.status(404).json({ success: false, message: 'Group not found' });

    const group = groupDoc.data();
    if (group.organizerId !== userId) return res.status(403).json({ success: false, message: 'Only organizer can delete group' });

    // delete subcollections safely
    try {
      const membersRef = groupRef.collection('members');
      const requestsRef = groupRef.collection('requests');
      await deleteCollection(membersRef);
      await deleteCollection(requestsRef);
    } catch (subErr) {
      console.warn('Failed to fully delete subcollections:', subErr.message || subErr);
      // continue to delete main doc regardless
    }

    // delete main group doc
    await groupRef.delete();

    res.json({ success: true, message: 'Group deleted' });
  } catch (err) {
    console.error('Delete study group error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete group', error: err.message });
  }
};
