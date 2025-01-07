"""
Returns the number of a specified element in a sorted list of integers.
"""

### __FRONT_TEXT_END__
import pytest
from collections import defaultdict
from bisect import bisect_left, bisect_right


def count_elements(sl, a):  # O(log(N))
    return bisect_right(sl, a) - bisect_left(sl, a)


def count_elements_naive(sl, a):  # O(N)
    c = defaultdict(int)
    for s in sl:
        c[s] += 1
    return c[a]


@pytest.mark.parametrize(
    "args,expected",
    [
        [[(sl := [1, 1, 1, 3, 4, 4, 4, 5, 6, 6]), 0], 0],
        [[sl, 1], 3],
        [[sl, 2], 0],
        [[sl, 3], 1],
        [[sl, 4], 3],
        [[sl, 5], 1],
        [[sl, 6], 2],
        [[sl, 7], 0],
    ],
)
def test(args, expected):
    assert count_elements(*args) == expected
    assert count_elements_naive(*args) == expected
