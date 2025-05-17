// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @dev Library for managing counters that can only be incremented, decremented, or reset.
 * This can be used to track elements in a mapping, issue IDs, or count request IDs, etc.
 */
library Counters {
    struct Counter {
        uint256 _value; // default: 0
    }

    function current(Counter storage counter) internal view returns (uint256) {
        return counter._value;
    }

    function increment(Counter storage counter) internal {
        unchecked {
            counter._value += 1;
        }
    }

    function decrement(Counter storage counter) internal {
        require(counter._value > 0, "Counter: decrement overflow");
        unchecked {
            counter._value -= 1;
        }
    }

    function reset(Counter storage counter) internal {
        counter._value = 0;
    }
}
