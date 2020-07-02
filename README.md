![banner](/rxdeep-banner.png)


**RxDeep**'s goal is to provide precise and efficient reactive state management. In [Redux](https://redux.js.org), you dispatch _actions_ to a singular state tree (the store) and can listen only to changes to all of the tree. In **RxDeep**, you make _changes_ to any node in the state tree, and can listen on any particular node of the state tree and get changes that affect that particular node only (instead of any action that might or might not change any part of the state tree).

Under the hood, every change issued to a node will be passed up the state tree, tracing the address of the change. Changes are then bounced back down the tree, propagating down selectively based on their traced address, only reaching nodes that are affected (including the node that originally issued the change). This ensures consistency along all nodes and listeners in an extremely efficient manner, allows for nice debug mechanisms such as record and replaying of changes, etc.

Each node (`State`) is bound to the rest of the state tree by a downstream (where it receives changes from higher up in the tree) and an upstream (where it announces changes to higher up in the tree). This enables exciting possibilities like having distributed state trees, for example using websockets or http endpoints as upstream and downstream of the root of each sub-tree (except the main root).

Anyways **RxDeep** is extremely early stage, so DO NOT USE IT! If you find it interesting, have any ideas, have a particular use-case in mind or want to contribute to the project, create issues or contact me via email.
