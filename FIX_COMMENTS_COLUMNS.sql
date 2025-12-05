nt.
         * @returns {boolean} `true` if the `id` node exists inside of a function node which can be used later.
         * @private
         */
        function isInsideOfStorableFunction(id, rhsNode) {
            const funcNode = astUtils.getUpperFunction(id);

            return (
                funcNode &&
                isInside(funcNode, rhsNode) &&
                isStorableFunction(funcNode, rhsNode)
            );
        }

        /**
         * Checks whether a given reference is a read to update itself or not.
         * @param {eslint-scope.Reference} ref A reference to check.
         * @param {ASTNode} rhsNode The RHS node of the previous assignment.
         * @returns {boolean} The reference is a read to update itself.
         * @private
         */
        function isReadForItself(ref, rhsNode) {
            const id = ref.identifier;
            const parent = id.parent;

            return ref.isRead() && (

                // self update. e.g. `a += 1`, `a++`
                (
                    (
                        parent.type === "AssignmentExpression" &&
                        parent.left === id &&
                        isUnusedExpression(parent) &&
                        !astUtils.isLogicalAssignmentOperator(parent.operator)
                    ) ||
                    (
                        parent.type === "UpdateExpression" &&
                        isUnusedExpression(parent)
                    )
                ) ||

                // in RHS of an assignment for itself. e.g. `a = a + 1`
                (
                    rhsNode &&
                    isInside(id, rhsNode) &&
                    !isInsideOfStorableFunction(id, rhsNode)
                )
            );
        }

        /**
         * Determine if an identifier is used either in for-in or for-of loops.
         * @param {Reference} ref The reference to check.
         * @returns {boolean} whether refere