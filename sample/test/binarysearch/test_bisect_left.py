"""
What is bisect_left?
"""

### __FRONT_TEXT_END__
import pytest
from bisect import bisect_left

"""
`bisect_left(sl, a)` returns the smallest index in the sorted list `sl`
where an element greater than or equal to `a` exists
"""

@pytest.mark.parametrize(
    "args,expected",
    [
                # 0  1  2  3  4  5  6  7  8  9
        [[(sl := [1, 1, 1, 3, 4, 4, 4, 5, 6, 6]), 0], 0],
        [[sl, 1], 0],
        [[sl, 2], 3],
        [[sl, 3], 3],
        [[sl, 4], 3],
        [[sl, 5], 7],
        [[sl, 6], 8],
        [[sl, 7], 10],  # = len(sl) if out of index
        [[sl, 12345], 10],
    ],
)
def test_bisect_left(args, expected):
    assert bisect_left(*args) == expected
