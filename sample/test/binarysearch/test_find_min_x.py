"""
Find the smallest x such that x^2 >= n

Please don't use bisect
"""

### __FRONT_TEXT_END__
import pytest


def find_min_x(n):
    lo, hi = 0, 2**32
    while lo < hi:
        mi = (lo + hi) // 2
        if mi * mi >= n:
            hi = mi
        else:
            lo = mi + 1
    return hi


@pytest.mark.parametrize(
    "args,expected",
    [
        [[0], 0],
        [[1], 1],
        [[8], 3],
        [[9], 3],
        [[10], 4],
        [[(n := 123456789) * n - 1], n],
        [[n * n], n],
        [[n * n + 1], n + 1],
    ],
)
def test(args, expected):
    assert find_min_x(*args) == expected
